
import Heartbeat from "@/models/Heartbeat"
import Project from "@/models/Project"
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
        if (!heartbeat || typeof heartbeat.entity !== "string" || typeof heartbeat.time !== "number") {
            return { status: 400, body: { error: "Entity and Time are required!!!" }}
        }

        const type = heartbeat.type === "file" ? "file" : "app"
        const category = heartbeat.category && categories.has(heartbeat.category) ? heartbeat.category : "coding" // unsure if there is a better category than this...?

        const doc = {
            user: userId,
            entity: heartbeat.entity,

            type,
            category,

            time: heartbeat.time,
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
                return { status: 201, body: { data: { entity: heartbeat.entity, time: heartbeat.time }}}
            }

            if (err?.name === "ValidationError") {
                return { status: 400, body: { error: err.message }}
            }

            // throw err
        }
    }

    public static async ingest(userId: Types.ObjectId, heartbeats: IncomingHeartbeat[], ctx: HeartbeatContext = {}) {
        return Promise.all(heartbeats.map(heartbeat => this.ingestOne(userId, heartbeat, ctx)))
    }
}