
import mongoose, { Schema } from "mongoose"

const HeartbeatSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entity: { type: String, required: true },

    type: { type: String, enum: ["file", "app"], required: true },
    category: { type: String, enum: [
        "coding", "building", "indexing", "debugging",
        "browsing", "running tests", "writing tests",
        "manual testing", "writing docs", "code reviewing", 
        "researching", "learning", "ai coding"
    ]},

    time: { type: Number, required: true }, // unix
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    branch: String,
    language: String,
    is_write: { type: Boolean, default: false },

    ide: String,
    os: String,
    machine: String,

    cursorpos: { type: Number, min: 0 },
    lineno: { type: Number, min: 0 },
    lines: { type: Number, min: 0 },
    lineadd: { type: Number, min: 0 },
    linerem: { type: Number, min: 0 }
}, { timestamps: true })

HeartbeatSchema.index({ user: 1, time: -1 })
HeartbeatSchema.index({ user: 1, project: 1, time: -1 })
HeartbeatSchema.index({ user: 1, entity: 1, time: 1 }, { unique: true })

export default mongoose.model("Heartbeat", HeartbeatSchema)