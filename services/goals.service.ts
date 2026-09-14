
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

export function formatGoalMinutes(minutes: number) {
    const total = Math.max(0, Math.round(minutes))
    const h = Math.floor(total / 60)
    const m = total % 60

    if (!h && !m) return "0m"
    if (!h) return `${m}m`
    if (!m) return `${h}h`

    return `${h}h ${m}m`
}

const PERIOD_SHORT = {
    day: "daily",
    week: "weekly",
    month: "monthly"
}

export type GoalProgress = {
    id: string
    period: string
    periodLabel: string
    scope: string
    seconds: number
    progressText: string
    targetText: string
    percent: number
    leftText: string
    done: boolean
}

export default class GoalsService {
    public static readonly MAX = 3

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
            const start = this.windowStart(goal.period, now).getTime() / 1000
            const languages = new Set(goal.languages)
            const projectIds = new Set(goal.projects.map(p => String(p._id)))

            let seconds = 0
            for (const { heartbeat, seconds: sec } of sliced) {
                if (heartbeat.time < start) continue
                if (languages.size && !languages.has(heartbeat.language ?? "")) continue
                if (projectIds.size && !projectIds.has(String(heartbeat.project?._id))) continue

                seconds += sec
            }
            seconds = Math.round(seconds)

            const target = goal.amount * 60
            const scope = [
                goal.languages.join(', '),
                goal.projects.map(p => p.name).join(", ")
            ].filter(Boolean).join(" - ") || "All programming activity"

            return {
                id: String(goal._id),
                period: goal.period,
                periodLabel: PERIOD_LABEL[goal.period as keyof typeof PERIOD_LABEL],
                scope,
                seconds,
                progressText: human(seconds),
                targetText: formatGoalMinutes(goal.amount),
                percent: Math.min(100, Math.round((seconds / target) * 100)),
                leftText: human(Math.max(0, target - seconds)),
                done: seconds >= target
            }
        })
    }

    public static async list(userId: Types.ObjectId) {
        return await Goal.find({ user: userId }).sort({ createdAt: 1}).lean()
    }

    public static async create(userId: Types.ObjectId, data: { amount: number, period: string }) {
        const count = await Goal.countDocuments({ user: userId })
        if (count >= this.MAX) {
            return { error: `You can only have ${this.MAX} goals` }
        }

        const period = data.period
        if (period !== "day" && period !== "week" && period !== "month") {
            return { error: "Invalid period" }
        }

        const amount = Math.round(data.amount)
        if (!Number.isFinite(amount) || amount < 1) {
            return { error: "Amount must be at least 1 minute" }
        }

        const goal = await Goal.create({
            user: userId,
            amount,
            period,
            languages: [],
            projects: []
        })

        return { goal }
    }

    public static async remove(userId: Types.ObjectId, goalId: string) {
        const result = await Goal.deleteOne({ _id: goalId, user: userId })
        if (!result.deletedCount) return { error: "Goal not found" }

        return { ok: true as const }
    }

    public static statusBarSuffix(goals: GoalProgress[]) {
        if (!goals.length) return ""
        return " - " + goals.map(g => {
            const label = PERIOD_SHORT[g.period as keyof typeof PERIOD_SHORT] ?? g.period
            return `${g.progressText}/${g.targetText} ${label}`
        }).join(" - ")
    }
}