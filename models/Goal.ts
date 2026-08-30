
import mongoose, { Schema } from "mongoose"

const GoalSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ["minutes", "hours"], required: true },
    period: { type: String, enum: ["day", "week", "month"], required: true },

    languages: { type: [String], default: [] },
    projects: { type: [{
        type: Schema.Types.ObjectId, ref: "Project"
    }], default: []}
}, { timestamps: true })

GoalSchema.virtual("targetSeconds").get(function () {
    return this.amount * (this.unit === "hours" ? 3600 : 60)
})

export default mongoose.model("Goal", GoalSchema)