
import { addDays, dateKey, endOfDay, human, startOfDay } from "@/util/time.ts"
import StatsService from "@/services/stats.service.ts"
import Heartbeat from "@/models/Heartbeat.ts"
import User from "@/models/User.ts"
import { Types } from "mongoose"

export const LeaderboardPeriods = ["24h", "7d", "all"] as const
export type LeaderboardPeriod = (typeof LeaderboardPeriods)[number]

export interface LeaderboardRow {
    rank: number
    userId: string
    username: string
    displayName: string
    total_seconds: number
    text: string
}

export interface LeaderboardSnapshot {
    period: LeaderboardPeriod
    rows: LeaderboardRow[]
    builtAt: Date
    expiresAt: Date
    cached: boolean
}

interface CacheEntry {
    rows: LeaderboardRow[]
    builtAt: number
    expiresAt: number
}

const TTL_MS = 20*60*1000
const STREAK_LOOPBACK_DAYS = 400
const DAY_IN_MS = 24 * 60 * 60 * 1000

export default class LeaderboardService {
    private static cache = new Map<LeaderboardPeriod, CacheEntry>()
    private static inflight = new Map<LeaderboardPeriod, Promise<LeaderboardSnapshot>>()

    public static async get(period: LeaderboardPeriod) {
        const now = Date.now()
        const hit = this.cache.get(period)

        if (hit && now < hit.expiresAt) {
            return {
                period,
                rows: hit.rows,
                builtAt: new Date(hit.builtAt),
                expiresAt: new Date(hit.expiresAt),
                cached: true
            }
        }

        const pending = this.inflight.get(period)
        if (pending) return pending

        const job = this.build(period).finally(() => this.inflight.delete(period))
        this.inflight.set(period, job)
        
        return job
    }

    private static window(period: LeaderboardPeriod) {
        const now = new Date()
        const to = endOfDay(now)

        if (period === "24h") return {
            from: new Date(now.getTime() - DAY_IN_MS),
            to
        }

        return {
            from: new Date(now.getTime() - 7 * DAY_IN_MS),
            to
        }
    }

    private static streak(activeDays: Set<string>) {
        let a = startOfDay(new Date())

        if (!activeDays.has(dateKey(a))) {
            a = addDays(a, -1)
            if (!activeDays.has(dateKey(a))) return 0
        }

        let count = 0
        while (activeDays.has(dateKey(a))) {
            count++
            a = addDays(a, -1)
        }

        return count
    }

    private static async build(period: LeaderboardPeriod) {
        const { from, to } = this.window(period)
        const fromUnix = from ? from.getTime() / 1000 : 0
        const toUnix = to.getTime() / 1000

        const streakFrom = addDays(startOfDay(new Date()), -STREAK_LOOPBACK_DAYS)
        const fetchFromUnix = Math.min(fromUnix, streakFrom.getTime() / 1000)

        const [ users, heartbeats ] = await Promise.all([
            User.find().select("username displayName").lean(),
            Heartbeat.find({
                time: from ? { $gte: fetchFromUnix, $lte: toUnix } : { $lte: toUnix }
            })
                .sort({ user: 1, time: 1 })
                .select("user time")
                .lean<{ user: Types.ObjectId, time: number }[]>()
        ])

        const byUser = new Map<string, { time: number }[]>()
        for (const hb of heartbeats) {
            const id = String(hb.user)
            const list = byUser.get(id)

            if (list) {
                list.push({ time: hb.time })
            } else {
                byUser.set(id, [{ time: hb.time }])
            }
        }

        const rows: LeaderboardRow[] = users
            .map(user => {
                const id = String(user._id)
                const all = byUser.get(id) ?? []
                const inPeriod = all.filter(h => h.time >= fromUnix && h.time <= toUnix)

                const sliced = StatsService.durations(
                    // (byUser.get(id) ?? []).map(h => ({
                    //     time: h.time,
                    //     entity: ""
                    // }))

                    inPeriod.map(h => ({
                        time: h.time,
                        entity: ""
                    }))
                )

                const total_seconds = Math.round(
                    sliced.reduce((sum, d) => sum + d.seconds, 0)
                )

                const activeDays = new Set<string>()
                for (const h of all) {
                    activeDays.add(dateKey(new Date(h.time * 1000)))
                }

                return {
                    rank: 0,
                    userId: id,
                    username: user.username,
                    displayName: user.displayName,
                    total_seconds,
                    text: human(total_seconds),
                    streak: this.streak(activeDays)
                }
            })
            .filter(r => r.total_seconds > 0)
            .sort((a, b) => b.total_seconds - a.total_seconds || a.username.localeCompare(b.username))
            .map((r, i) => ({ ...r, rank: i + 1 }))

        const builtAt = Date.now()
        const expiresAt = builtAt + TTL_MS

        this.cache.set(period, { rows, builtAt, expiresAt })

        return {
            period,
            rows,
            builtAt: new Date(builtAt),
            expiresAt: new Date(expiresAt),
            cached: false
        }
    }
}