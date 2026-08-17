
import HeartbeatService from "@/services/heartbeat.service.ts"
import { reqApi } from "@/middlewares/auth.middleware.ts"
import { Request, Response, Router } from "express"

const router = Router()

function resolveUser(req: Request, res: Response) {
    const reqq = req.params.user
    const user = req.user!

    if (!reqq || reqq === "current" || reqq === String(user._id) || reqq === user.username) return user

    res.status(403).json({ error: "Forbidden" })
    return null
}

const RANGES = {
    today: 1,
    yesterday: 2,
    last7days: 7,
    last14days: 14,
    last30days: 30,
    lastmonth: 30,
    last6months: 182,
    lastyear: 365
}

async function ingest(req: Request, res: Response) {
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
}

router.post("/v1/users/:user/heartbeats", reqApi, ingest)
router.post("/v1/users/:user/heartbeats.bulk", reqApi, ingest)

router.get("/v1/users/:user/statusbar/today", reqApi, async (req: Request, res: Response) => {
    const user = resolveUser(req, res)
    if (!user) return

    
    res.json({
        cached_at: new Date().toISOString(),
        data: {}
    })
})