
import { dateKey, startOfDay, endOfDay, totals, addDays } from "@/util/time.ts"
import StatsService, { Aggregate } from "@/services/stats.service.ts"
import HeartbeatService from "@/services/heartbeat.service.ts"
import { reqApi } from "@/middlewares/auth.middleware.ts"
import { Request, Response, Router } from "express"
import type { Types } from "mongoose"

const router = Router()
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const RANGES: Record<string, number> = {
    today: 1,
    yesterday: 2,
    last_7_days: 7,
    last_14_days: 14,
    last_30_days: 30,
    last_month: 30,
    last_6_months: 182,
    last_year: 365
}

function resolveUser(req: Request, res: Response) {
    const reqq = req.params.user
    const user = req.user!

    if (!reqq || reqq === "current" || reqq === String(user._id) || reqq === user.username) return user

    res.status(403).json({ error: "Forbidden" })
    return null
}

async function resolveWindow(userId: Types.ObjectId, query: Request["query"]) {
    const now = new Date()

    const start = typeof query.start === "string" ? new Date(query.start) : null
    const end = typeof query.end === "string" ? new Date(query.end) : null

    if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
        return { 
            from: startOfDay(start), 
            to: endOfDay(end)
        }
    }

    const range = typeof query.range === "string" ? query.range.toLowerCase() : "last_7_days"

    if (range === "yesterday") {
        const y = addDays(now, -1)
        return {
            from: startOfDay(y),
            to: endOfDay(y)
        }
    }

    if (range === "any" || range === "alltime") {
        const first = await StatsService.firstHeartbeatAt(userId)
        return {
            from: startOfDay(first ?? now),
            to: endOfDay(now)
        }
    }

    const days = RANGES[range] ?? 7
    return {
        from: startOfDay(addDays(now, -(days - 1))),
        to: endOfDay(now)
    }
}

function rangeOf(from: Date, to: Date) {
    return {
        date: dateKey(from),
        start: from.toISOString(),
        end: to.toISOString(),
        text: from.toDateString() === to.toDateString() ? from.toDateString() : `${from.toDateString()} - ${to.toDateString()}`,
        timezone: TIMEZONE
    }
}

// https://wakatime.com/developers#summaries
function summaryPayload(aggregate: Aggregate, from: Date, to: Date) {
    return {
        grand_totals: totals(aggregate.total_seconds),
        categories: aggregate.categories,
        projects: aggregate.projects,
        languages: aggregate.languages,
        editors: aggregate.editors,
        oses: aggregate.oses,
        machines: aggregate.machines,
        branches: aggregate.branches,
        dependancies: [],
        range: rangeOf(from, to)
    }
}

router.post(["/v1/users/:user/heartbeats", "/v1/users/:user/heartbeats.bulk"], reqApi, async (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return

    const payload = req.body
    const list = Array.isArray(payload) ? payload : [payload]

    if (!list.length) return res.status(400).json({ error: "No heartbeats given!" })

    const ctx = HeartbeatService.context(
        req.headers["user-agent"],
        (req.headers["x-machine-name"] as string | undefined)
    )

    const ress = await HeartbeatService.ingest(user._id, list, ctx)

    if (!Array.isArray(payload)) {
        const single = ress[0]!
        return res.status(single.status).json(single.body)
    }

    res.status(200).json({ responses: ress.map(r => [r.body, r.status]) })
})

router.get("/v1/users/:user/statusbar/today", reqApi, async (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return

    const now = new Date()
    const aggregate = await StatsService.today(user._id)

    res.json({
        cached_at: new Date().toISOString(),
        data: summaryPayload(aggregate, startOfDay(now), endOfDay(now))
    })
})

router.get("/v1/users/:user", reqApi, (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return
    
    res.json({
        data: {
            id: user._id,
            username: user.username,
            display_name: user.username
        }
    })   
})

router.get("/v1/users/:user/summaries", reqApi, async (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return

    const project = typeof req.query.project === "string" ? req.query.project : undefined
    const { from, to } = await resolveWindow(user._id, req.query)

    const days: any[] = []
    let cursor = startOfDay(from)
    let guard = 0

    while (cursor <= to && guard < 365) {
        const dayStart = startOfDay(cursor)
        const dayEnd = endOfDay(cursor)

        const aggregate = await StatsService.aggregate(user._id, dayStart, dayEnd, project)
        days.push(summaryPayload(aggregate, dayStart, dayEnd))

        cursor = addDays(cursor, 1)
        guard++
    }

    const cumulative = days.reduce((sum, d) => sum + d.grand_total.total_seconds, 0)

    res.json({
        data: days,
        start: from.toISOString(),
        end: to.toISOString(),
        cumulative_total: totals(cumulative)
    })
})

router.get(["/v1/users/:user/stats", "/v1/users/:user/stats/:range"], reqApi, async (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return

    const project = typeof req.query.project === "string" ? req.query.project : undefined
    const range = req.params.range ? String(req.params.range) : "last_7_days"
    const { from, to } = await resolveWindow(user._id, { ...req.query, range })

    const aggregate = await StatsService.aggregate(user._id, from, to, project)

    res.json({
        data: {
            ...summaryPayload(aggregate, from, to),
            username: user.username,
            status: "ok",
            is_up_to_date: true
        }
    })
})

export default router