
import { optionalAuth, reqAuth } from "@/middlewares/auth.middleware.ts"
import StatsService from "@/services/stats.service.ts"
import { Request, Response, Router } from 'express'
import Project from "@/models/Project.ts"
import GoalsService from "@/services/goals.service.ts";

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
        
        // if authenticated, show dashboard (/dashboard)
        res.render("dashboard", {
            range,
            ranges: Object.keys(RANGE), period, goals
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
/*
router.get("/leaderboard", reqAuth, async (req: Request, res: Response) => {

})
*/

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