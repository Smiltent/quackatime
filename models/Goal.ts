
import { formatGoalMinutes } from "@/services/goals.service.ts"
import mongoose, { Schema } from "mongoose"

const GoalSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true, min: 1 }, // in minutes
    period: { type: String, enum: ["day", "week", "month"], required: true },

    languages: { type: [String], default: [] },
    projects: { type: [{
        type: Schema.Types.ObjectId, ref: "Project"
    }], default: []}
}, { timestamps: true })

GoalSchema.virtual("amountText").get(function () {
    return formatGoalMinutes(this.amount)
})

GoalSchema.virtual("targetSeconds").get(function () {
    return this.amount * 60
})

export default mongoose.model("Goal", GoalSchema)