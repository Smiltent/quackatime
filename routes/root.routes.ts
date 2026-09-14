
import { human, endOfDay, startOfDay, startOfWeek, startOfMonth, startOfYear, addDays, dateKey } from "@/util/time.ts"
import LeaderboardService, { LeaderboardPeriod, LeaderboardPeriods } from "@/services/leaderboard.service.ts"
import { optionalAuth, reqAuth } from "@/middlewares/auth.middleware.ts"
import StatsService from "@/services/stats.service.ts"
import GoalsService from "@/services/goals.service.ts"
import AuthService from "@/services/auth.service.ts"
import { Request, Response, Router } from 'express'
import Project from "@/models/Project.ts"

const router = Router()

const RANGE_PRESETS = [
    "today",
    "yesterday",
    "thisweek",
    "last7days",
    "thismonth",
    "last30days",
    "thisyear",
    "last12months",
    "alltime",
    "custom"
]

type RangePreset = (typeof RANGE_PRESETS)[number]
const RANGE_LABELS: Record<RangePreset, string> = {
    "today": "Today",
    "yesterday": "Yesterday",
    "thisweek": "This week",
    "last7days": "Last 7 days",
    "thismonth": "This month",
    "last30days": "Last 30 days",
    "thisyear": "This year",
    "last12months": "Last 12 months",
    "alltime": "All time",
    "custom": "Custom"
}

function parseDay(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    const d = new Date(value + "T00:00:00")

    return Number.isNaN(d.getTime()) ? null : d
}

function pickRange(query: Request["query"]) {
    const raw = typeof query.range === "string" ? query.range : "alltime"
    const range = (RANGE_PRESETS as readonly string[]).includes(raw)
        ? raw as RangePreset
        : "alltime"

    const now = new Date()

    let from: Date = new Date()
    let to = endOfDay(now)

    switch (range) {
        case "custom": {
            const fromRaw = parseDay(query.from)
            const toRaw = parseDay(query.to)

            from = startOfDay(fromRaw ?? addDays(now, -6))
            to = endOfDay(toRaw ?? now)

            if (from > to) {
                [from, to] = [startOfDay(to), endOfDay(from)]
            }
            break
        }

        case "today": 
            from = startOfDay(now)
            break

        case "yesterday": {
            const y = addDays(now, -1)
            from = startOfDay(y)
            to = endOfDay(y)
            break
        }

        case "thisweek": 
            from = startOfWeek(now)
            break

        case "thismonth": 
            from = startOfMonth(now)
            break

        case "thisyear": 
            from = startOfYear(now)
            break

        case "last7days": 
            from = startOfDay(addDays(now, -6))
            break

        case "last30days":
            from = startOfDay(addDays(now, -29))
            break

        case "last12months": {
            const d = new Date(now)
            d.setFullYear(d.getFullYear() - 1)

            from = startOfDay(d)
            break
        }

        case "alltime":
        default: {
            from = startOfDay(now)
            break
        }
    }

    const label = range === "custom"
        ? `${dateKey(from)} => ${dateKey(to)}`
        : RANGE_LABELS[range]

    return {
        range,
        from,
        to,
        fromKey: dateKey(from),
        toKey: dateKey(to),
        label,
        presets: RANGE_PRESETS.filter(p => p !== "custom"),
        labels: RANGE_LABELS
    }
}

function pickFacets(query: Request["query"]) {
    const str = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : undefined

    return {
        project: str(query.project),
        language: str(query.language),
        os: str(query.os),
        editor: str(query.editor),
        category: str(query.category)
    }
}

function qStr(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()

    for (const [k, v] of Object.entries(params)) {
        if (v) {
            sp.set(k, v)
        }
    }

    const s = sp.toString()
    return s ? `/?${s}` : "/"
}

// dashboard
router.get("/", optionalAuth, async (req: Request, res: Response) => {
    const user = req.user

    // if authenticated, show dashboard view - else, redirect to login
    if (!user) return res.redirect("/login")

    let resolved = pickRange(req.query)
    if (resolved.range === "alltime") {
        const first = await StatsService.firstHeartbeatAt(user._id)
        resolved = {
            ...resolved,
            from: first ? startOfDay(first) : startOfDay(new Date()),
            fromKey: dateKey(first ? startOfDay(first) : startOfDay(new Date())),
            toKey: dateKey(resolved.to),
            label: "All time"
        }
    }

    const facets = pickFacets(req.query)

    const [optionsPeriod, period, goals] = await Promise.all([
        StatsService.aggregate(user._id, resolved.from, resolved.to),        
        StatsService.aggregate(user._id, resolved.from, resolved.to, facets),
        GoalsService.progress(user._id)
    ])

    const maxSeconds = Math.max(0, ...period.projects.map(p => p.total_seconds))

    const baseQuery = {
        range: resolved.range,
        from: resolved.range === "custom" ? resolved.fromKey : undefined,
        to: resolved.range === "custom" ? resolved.toKey : undefined,
        project: facets.project,
        language: facets.language,
        os: facets.os,
        editor: facets.editor,
        category: facets.category
    }
    
    res.render("dashboard", {
        goals,
        filters: {
            range: resolved.range,
            from: resolved.fromKey,
            to: resolved.toKey,
            label: resolved.label,
            presets: resolved.presets,
            labels: resolved.labels,
            project: facets.project ?? "",
            language: facets.language ?? "",
            os: facets.os ?? "",
            editor: facets.editor ?? "",
            category: facets.category ?? ""
        },
        filterOptions: {
            projects: optionsPeriod.projects.map(b => b.name),
            languages: optionsPeriod.languages.map(b => b.name),
            oses: optionsPeriod.oses.map(b => b.name),
            editors: optionsPeriod.editors.map(b => b.name),
            categories: optionsPeriod.categories.map(b => b.name)
        },
        queryBase: baseQuery,
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
            languages: period.languages.map(b => ({ label: b.name, value: b.total_seconds, text: b.text })),
            editors: period.editors.map(b => ({ label: b.name, value: b.total_seconds, text: b.text })),
            oses: period.oses.map(b => ({ label: b.name, value: b.total_seconds, text: b.text })),
            projects: period.projects.map(b => ({ label: b.name, value: b.total_seconds, text: b.text }))
        }
    })

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
    const showArch = req.query.show === "archived"

    let resolved = pickRange(req.query)
    if (resolved.range === "alltime") {
        const first = await StatsService.firstHeartbeatAt(user._id)
        resolved = {
            ...resolved,
            from: first ? startOfDay(first) : startOfDay(new Date()),
            fromKey: dateKey(first ? startOfDay(first) : startOfDay(new Date())),
            toKey: dateKey(resolved.to),
            label: "All time"
        }
    }

    const [projects, breakdown] = await Promise.all([
        Project.find({ user: user._id, archived: showArch ? true : { $ne: true } }).sort({ name: 1 }).lean(),
        showArch
            ? Promise.resolve(new Map())
            : StatsService.byProjects(user._id, resolved.from, resolved.to)
    ])

    let rows
    if (showArch) {
        rows = await Promise.all(projects.map(async p => {
            const stats = await StatsService.aggregate(
                user._id,
                resolved.from,
                resolved.to,
                { project: p.name }
            )

            return {
                name: p.name,
                archived: true,
                total_seconds: stats.total_seconds,
                text: human(stats.total_seconds),
                languages: stats.languages.slice(0, 3).map(l => l.name)
            }
        }))
    } else {
        rows = projects.map(p => {
            const stats = breakdown.get(p.name)
            return {
                name: p.name,
                archived: false,
                total_seconds: stats?.total_seconds ?? 0,
                text: stats?.text ?? "0 secs",
                languages: (stats?.languages ?? []).slice(0, 3).map(l => l.name)
            }
        })
    }

    rows.sort((a, b) => b.total_seconds - a.total_seconds)

    res.render("projects/index", {
        showArch,
        filters: {
            range: resolved.range,
            from: resolved.fromKey,
            to: resolved.toKey,
            label: resolved.label,
            presets: resolved.presets,
            labels: resolved.labels
        },
        rows
    })
})

router.get("/my/projects/:name", reqAuth, async (req: Request, res: Response) => {
    res.render("projects/view")
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
function settingsFlash(req: Request) {
    return {
        error: typeof req.query.err === "string"
            ? req.query.err
            : typeof req.query.error === "string"
                ? req.query.error
                : null,
        ok: typeof req.query.ok === "string" ? req.query.ok : null
    }
}

router.get("/my/settings", reqAuth, async (req: Request, res: Response) => {
    const user = req.user!
    const goals = await GoalsService.progress(user._id)

    res.render("settings/account", {
        tab: "account",
        profile: {
            username: user.username,
            displayName: user.displayName,
            email: user.email
        },
        goals,
        goalsMax: GoalsService.MAX,
        goalsRemaining: Math.max(0, GoalsService.MAX - goals.length),
        ...settingsFlash(req)
    })
})

router.get("/my/settings/setup", reqAuth, async (req: Request, res: Response) => {
    const user = req.user!
    const hasApiKey = await AuthService.hasApiKey(user._id)
    
    let revealedKey = null
    if (typeof req.cookies?.api_key_once === "string") {
        revealedKey = req.cookies.api_key_once
        res.clearCookie("api_key_once")
    }

    const host = req.get("host") || "localhost"
    const apiBase = `${req.protocol}://${host}`

    res.render("settings/setup", {
        tab: "setup",
        hasApiKey,
        revealedKey,
        apiBase,
        ...settingsFlash(req)
    })
})

router.get("/my/settings/security", reqAuth, async (req: Request, res: Response) => {
    res.render("settings/security", {
        tab: "security",
        ...settingsFlash(req)
    })
})

export default router