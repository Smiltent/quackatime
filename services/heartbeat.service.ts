// deno-lint-ignore-file no-explicit-any

import Heartbeat from "@/models/Heartbeat.ts"
import Project from "@/models/Project.ts"
import type { Types } from "mongoose"

const categories = new Set([
    "coding", "building", "indexing", "debugging",
    "browsing", "running tests", "writing tests",
    "manual testing", "writing docs", "code reviewing", 
    "researching", "learning", "ai coding"
])

interface IncomingHeartbeat {
    entity: string

    type?: string
    category?: string

    time: number
    project?: string | null
    branch?: string | null
    language?: string | null
    is_write?: boolean

    cursorpos?: number
    lineno?: number
    lines?: number
    lineadd?: number
    linerem?: number
}

export interface HeartbeatContext {
    ide?: string
    os?: string
    machine?: string
}

export default class HeartbeatService {
    public static context(userAgent?: string, machine?: string): HeartbeatContext {
        const ctx: HeartbeatContext = { machine: machine || undefined }
        if (!userAgent) return ctx

        const os = userAgent.match(/\(([^)]+)\)/)?.[1]
        if (os) ctx.os = os.split("-")[0]

        const pairs = [...userAgent.matchAll(/([\w.+-]+)\/[\w.+-]+/g)].map(m => m[1])
        const plugin = pairs.at(-1)

        if (plugin) {
            const ide = plugin.replace(/-wakatime$/, "")
            ctx.ide = ide === "wakatime" ? "wakatime-cli" : ide
        }

        return ctx
    }

    private static async resolveProj(userId: Types.ObjectId, name?: string | null) {
        if (!name) return undefined

        const project = await Project.findOneAndUpdate(
            { user: userId, name },
            { $setOnInsert: { user: userId, name } },
            { upsert: true, new: true }
        )

        return project._id
    }

    public static async ingestOne(
        userId: Types.ObjectId,
        heartbeat: IncomingHeartbeat,
        ctx: HeartbeatContext
    ) {
        const time = Number(heartbeat?.time)
        if (!heartbeat || typeof heartbeat.entity !== "string" || !Number.isFinite(time)) {
            return { status: 400, body: { error: "Entity and Time are required!!!" }}
        }

        const type = heartbeat.type === "file" ? "file" : "app"
        const category = heartbeat.category && categories.has(heartbeat.category) ? heartbeat.category : "coding" // unsure if there is a better category than this...?

        const doc = {
            user: userId,
            entity: heartbeat.entity,

            type,
            category,

            time,
            project: await this.resolveProj(userId, heartbeat.project),
            branch: heartbeat.branch ?? undefined,
            language: heartbeat.language ?? undefined,
            is_write: heartbeat.is_write ?? false,

            ide: ctx.ide,
            os: ctx.os,
            machine: ctx.machine,

            cursorpos: heartbeat.cursorpos,
            lineno: heartbeat.lineno,
            lines: heartbeat.lines,
            lineadd: heartbeat.lineadd,
            linerem: heartbeat.linerem
        }

        try {
            const created = await new Heartbeat(doc).save()
            return { status: 201, body: { data: { id: created._id, entity: created.entity, time: created.time }}}
        } catch (err: any) {
            if (err?.code === 11000) {
                return { status: 201, body: { data: { entity: heartbeat.entity, time }}}
            }

            if (err?.name === "ValidationError") {
                return { status: 400, body: { error: err.message }}
            }

            console.error(`Failed to store heartbeat: ${err}`)
            return { status: 500, body: { error: "Failed to store heartbeat" }}
        }
    }

    public static ingest(userId: Types.ObjectId, heartbeats: IncomingHeartbeat[], ctx: HeartbeatContext = {}) {
        return Promise.all(heartbeats.map(heartbeat => this.ingestOne(userId, heartbeat, ctx)))
    }
}