
import Heartbeat from "@/models/Heartbeat.ts"
import type { Types } from "mongoose"
import { dateKey, dayKey, digital, eachDay, human } from "@/util/time.ts";

interface HeartbeatLean {
    time: number
    language?: string | null
    category?: string | null
    project?: { _id: Types.ObjectId, name: string } | null
    branch?: string | null
    ide?: string | null
    os?: string | null
    machine?: string | null
    entity: string
}

type Counter = Map<string, number>

// adds `+sec` to the total of `key` in Counter
function bump(counter: Counter, key: string | null | undefined, sec: number) {
    if (!key) key = "unknown"
    counter.set(key, (counter.get(key) ?? 0) + sec)
}

// convert Counter into an array, summerizing, sorted by size
function toBuckets(counter: Counter, total: number) {
    return[...counter.entries()]
        .filter(([_string, sec]) => sec > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, raw]) => {
            const sec = Math.round(raw)

            return {
                name,
                total_seconds: sec,
                percent: total > 0 ? Number(((sec / total) * 100).toFixed(2)) : 0,
                text: human(sec),
                digital: digital(sec),
                decimal: (sec / 3600).toFixed(2),
                hours: Math.floor(sec / 3600),
                minutes: Math.floor((sec % 3600) / 60),
                seconds: sec % 60
            }
        })
}

export default class StatsService {
    private static async fetch(userId: Types.ObjectId, from: Date, to: Date, project?: string) {
        const heartbeats = await Heartbeat.find({
            user: userId,
            time: { $gte: from.getTime() / 1000, $lte: to.getTime() / 1000 }
        })
        .sort({ time: 1 })
        .populate("project", "name")
        .lean<HeartbeatLean[]>()
        
        if (!project) return heartbeats
        return heartbeats.filter(h => h.project?.name === project)
    }

    // turns a stream of heartbeats into durations
    public static durations(heartbeats: HeartbeatLean[]) {
        return heartbeats.map((heartbeat, i) => {
            const next = heartbeats[i + 1]
            const gap = next ? next.time - heartbeat.time : Infinity

            return {
                heartbeat,
                seconds: gap <= 15 * 60 ? gap : 30
            }
        })
    }

    public static async aggregate(
        userId: Types.ObjectId,
        from: Date,
        to: Date,
        project?: string
    ) {
        const heartbeats = await this.fetch(userId, from, to, project)
        const sliced = this.durations(heartbeats)

        const counters = {
            projects: new Map() as Counter,
            languages: new Map() as Counter,
            editors: new Map() as Counter,
            oses: new Map() as Counter,
            machines: new Map() as Counter,
            categories: new Map() as Counter,
            branches: new Map() as Counter
        }

        const days: Counter = new Map()
        for (const day of eachDay(from, to)) days.set(dateKey(day), 0)

        let total = 0
        for (const { heartbeat, seconds } of sliced) {
            total += seconds

            bump(counters.projects, heartbeat.project?.name, seconds)
            bump(counters.languages, heartbeat.language, seconds)
            bump(counters.editors, heartbeat.ide, seconds)
            bump(counters.oses, heartbeat.os, seconds)
            bump(counters.machines, heartbeat.machine, seconds)
            bump(counters.categories, heartbeat.category, seconds)
            bump(counters.branches, heartbeat.branch, seconds)

            bump(days, dayKey(heartbeat.time), seconds)
        }

        return {
            total_seconds: Math.round(total),
            projects: toBuckets(counters.branches, total),
            languages: toBuckets(counters.languages, total),
            editors: toBuckets(counters.editors, total),
            oses: toBuckets(counters.oses, total),
            machines: toBuckets(counters.machines, total),
            categories: toBuckets(counters.categories, total),
            branches: toBuckets(counters.branches, total),
            days: [...days.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([date, seconds]) => ({ date, total_seconds: Math.round(seconds)})),
            heartbeats: heartbeats.length,
            last_heartbeat_at: heartbeats.at(-1)?.time ?? null
        }
    }

    public static today() {

    }

    public static range() {

    }

    public static async allTime() {

    }
}