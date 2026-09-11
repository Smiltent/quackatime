
import LeaderboardService, { LeaderboardPeriod, LeaderboardPeriods } from "@/services/leaderboard.service.ts"
import { optionalAuth, reqAuth } from "@/middlewares/auth.middleware.ts"
import StatsService from "@/services/stats.service.ts"
import GoalsService from "@/services/goals.service.ts"
import { Request, Response, Router } from 'express'
import Project from "@/models/Project.ts"
import { human } from "@/util/time.ts"

const router = Router()
const RANGE = {
    today: 1,
    last7days: 7,
    last30days: 30,
    lastyear: 365
}

function pickRange(value: unknown) {
    const r = (
        typeof value === "string" && value in RANGE ? value : "last7days"
    ) as keyof typeof RANGE

    return { range: r, days: RANGE[r] }
}

// dashboard
router.get("/", optionalAuth, async (req: Request, res: Response) => {
    const user = req.user

    if (user) {
        const { range, days } = pickRange(req.query.range)
        const [period, goals] = await Promise.all([
            StatsService.range(user._id, days),
            GoalsService.progress(user._id)
        ])

        const maxSeconds = Math.max(0, ...period.projects.map(p => p.total_seconds))
        
        // if authenticated, show dashboard (/dashboard)
        res.render("dashboard", {
            range,
            goals,
            ranges: Object.keys(RANGE), 
            period: {
                ...period,
                text: human(period.total_seconds)
            }, 
            durations: period.projects.slice(0,8).map(p => ({
                name: p.name,
                text: p.text,
                width: maxSeconds > 0 ? Math.round((p.total_seconds / maxSeconds) * 100) : 0
            })),
            charts: {
                days: period.days.map(d => ({
                    label: d.date,
                    value: d.total_seconds
                })),
                languages: period.languages.map(b => ({ label: b.name, value: b.total_seconds })),
                editors: period.editors.map(b => ({ label: b.name, value: b.total_seconds })),
                oses: period.oses.map(b => ({ label: b.name, value: b.total_seconds })),
                projects: period.projects.map(b => ({ label: b.name, value: b.total_seconds }))
            }
        })
    } else {
        // if unauthenticated, show auth
        res.redirect("/login")
    }
})

// auth
router.get("/login", optionalAuth, (req: Request, res: Response) => {
    const user = req.user

    if (!user) {
        res.render("auth/login")
    } else {
        res.redirect("/")
    }
})

router.get("/register", optionalAuth, (req: Request, res: Response) => {
    const user = req.user

    if (!user) {
        res.render("auth/register")
    } else {
        res.redirect("/")
    }
})

// projects
router.get("/my/projects", reqAuth, async (req: Request, res: Response) => {
    const user = req.user!
    const { range, days } = pickRange(req.query.range)

    const [projects, period] = await Promise.all([
        Project.find({ user: user._id }).sort({ name: 1 }).lean(),
        StatsService.range(user._id, days)
    ])

    const totals = new Map(period.projects.map(p => [p.name, p]))

    res.render("projects/index", {
        range,
        ranges: Object.keys(RANGE),
        rows: projects
            .map(p => ({
                name: p.name,
                repo: p.repo ?? null,
                total_seconds: totals.get(p.name)?.total_seconds ?? 0,
                text: totals.get(p.name)?.text ?? "0 secs"
            }))
            .sort((a, b) => b.total_seconds - a.total_seconds)
    })
})

router.get("/my/projects/:name", reqAuth, async (req: Request, res: Response) => {
    
})

// lb

function pickLbPeriod(value: unknown): LeaderboardPeriod {
    return (
        typeof value === "string" && (LeaderboardPeriods as readonly string[]).includes(value)
            ? value
            : "24h"
    ) as LeaderboardPeriod
}

router.get("/leaderboard", reqAuth, async (req: Request, res: Response) => {
    const period = pickLbPeriod(req.query.period)
    const board = await LeaderboardService.get(period)
    const me = String(req.user!._id)

    res.render("leaderboard", {
        period,
        periods: LeaderboardPeriods,
        rows: board.rows,
        me,
        myRank: board.rows.find(r => r.userId === me)?.rank ?? null,
        builtAt: board.builtAt.toISOString(),
        expiresAt: board.expiresAt.toISOString(),
        cached: board.cached
    })
})


// settings
/*
router.get("/my/settings", reqAuth, async (req: Request, res: Response) => {

})

router.get("/my/settings/setup", reqAuth, async (req: Request, res: Response) => {

})

router.get("/my/settings/security", reqAuth, async (req: Request, res: Response) => {

})
*/

export default router