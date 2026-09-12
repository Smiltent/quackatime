import mongoose from "mongoose"
import User from "@/models/User.ts"
import Goal from "@/models/Goal.ts"

/** Daily goals for user "test", amounts in minutes. */
const GOALS = [
    { amount: 30, period: "day" as const },
    { amount: 60, period: "day" as const },
    { amount: 90, period: "day" as const }
]

async function main() {
    const uri = process.env.MONGO_URI
    if (!uri) throw new Error("MONGO_URI is unset — run with --env-file")

    console.log("Connecting…")
    await mongoose.connect(uri)

    const user = await User.findOne({ username: "test" })
    if (!user) {
        throw new Error('User "test" not found')
    }

    console.log(`Found user: ${user.username} (${user._id})`)

    // Replace existing goals so re-runs stay idempotent
    const deleted = await Goal.deleteMany({ user: user._id })
    if (deleted.deletedCount) {
        console.log(`  removed ${deleted.deletedCount} existing goal(s)`)
    }

    for (const g of GOALS) {
        const goal = await Goal.create({
            user: user._id,
            amount: g.amount,
            period: g.period,
            languages: [],
            projects: []
        })
        console.log(`  created goal: ${g.amount} min / ${g.period} (${goal._id})`)
    }

    await mongoose.disconnect()
    console.log("Done.")
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
