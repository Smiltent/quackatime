
import mongoose, { Schema } from "mongoose"

const ProjectSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    repo: { type: String },
    badge: { type: String },
    
    archived: { type: Boolean, default: false, index: true },
})

ProjectSchema.index({ user: 1, name: 1 }, { unique: true })

export default mongoose.model("Project", ProjectSchema)