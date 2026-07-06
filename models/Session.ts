
import mongoose, { Schema } from "mongoose"

const SessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true })

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model("Session", SessionSchema)