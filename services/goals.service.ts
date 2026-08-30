
import { startOfDay, startOfMonth, startOfWeek, human } from "@/util/time.ts"
import StatsService, { HeartbeatLean } from "@/services/stats.service.ts"
import Heartbeat from "@/models/Heartbeat.ts"
import Goal from "@/models/Goal.ts"
import { Types } from "mongoose"

const PERIOD_LABEL = {
    day: "Daily goal",
    week: "Weekly goal",
    month: "Monthly goal"
}

interface ProjectLean {
    _id: Types.ObjectId
    name: string
}

export default class GoalsService {
    private static windowStart(period: string, now: Date) {
        if (period === "day") return startOfDay(now)
        if (period === "week") return startOfWeek(now)
        return startOfMonth(now)
    }

    public static async progress(userId: Types.ObjectId) {
        const goals = await Goal.find({ user: userId })
            .populate<{ projects: ProjectLean[] }>("projects", "name")
            .lean()

        if (!goals.length) return []

        const now = new Date()
        const from = Math.min(
            ...goals.map(g => this.windowStart(g.period, now).getTime())
        )

        const heartbeats = await Heartbeat.find({
            user: userId,
            time: {
                $gte: from / 1000,
                $lte: now.getTime() / 1000
            }
        })
        .sort({ time: 1 })
        .populate("project", "name")
        .lean<HeartbeatLean[]>()

        const sliced = StatsService.durations(heartbeats)

        return goals.map(goal => {
            const start = this.windowStart(goal.period, now).getTime()
            const languages = new Set(goal.languages)
            const projectIds = new Set(goal.projects.map(p => String(p._id)))

            let seconds = 0
            for (const { heartbeat, seconds: sec } of sliced) {
                if (heartbeat.time < start) continue
                if (languages.size && !languages.has(heartbeat.language ?? "")) continue
                if (projectIds.size && !projectIds.has(String(heartbeat.project?._id)))

                seconds += sec
            }
            seconds = Math.round(seconds)

            const target = goal.amount * (goal.unit === "hours" ? 3600 : 60)
            const scope = [
                goal.languages.join(', '),
                goal.projects.map(p => p.name).join(", ")
            ].filter(Boolean).join(" - ") || "ALL PROGRAMMING ACTIVITY"

            return {
                id: String(goal._id),
                period: goal.period,
                periodLabel: PERIOD_LABEL[goal.period as keyof typeof PERIOD_LABEL],
                scope,
                seconds,
                progressText: human(seconds),
                targetText: `${goal.amount} ${goal.unit === "hours" ? "hrs" : "mins"}`,
                percent: Math.min(100, Math.round((seconds / target) * 100)),
                leftText: human(Math.max(0, target - seconds)),
                done: seconds >= target
            }
        })
    }
}