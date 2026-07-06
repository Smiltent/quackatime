
import mongoose, { Schema } from "mongoose"

const SummarySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    editors: { type: [String], required: true },
    languages: { type: [String], required: true },
    machines: { type: [String], required: true },
    os: { type: [String], required: true },
    projects: { type: [Schema.Types.ObjectId], ref: "Project", required: true }
}, { timestamps: true })

export default mongoose.model("Summary", SummarySchema)