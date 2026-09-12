import mongoose from "mongoose"
import User from "@/models/User.ts"
import Project from "@/models/Project.ts"
import Heartbeat from "@/models/Heartbeat.ts"

const USERNAME = "test"
const TARGET_SECONDS = 30 * 60
const INTERVAL = 60

const PROJECT_POOL = [
    "quackatime", "duckpond", "nest-api", "feather-ui", "mallard-cli",
    "waddle-bot", "bill-tracker", "pond-sync", "egg-timer", "flock-db"
]

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
}

/** One continuous session ending now; durations sum ≈ TARGET_SECONDS. */
function buildStackedTimeline(targetSeconds: number) {
    const now = Math.floor(Date.now() / 1000)
    const span = targetSeconds - 30
    const count = Math.ceil(span / INTERVAL) + 1
    const start = now - span

    const times: number[] = []
    for (let i = 0; i < count; i++) {
        times.push(i === count - 1 ? now : start + i * INTERVAL)
    }
    return times
}

async function main() {
    const uri = process.env.MONGO_URI
    if (!uri) throw new Error("MONGO_URI is unset — run with --env-file")

    console.log("Connecting…")
    await mongoose.connect(uri)

    const user = await User.findOne({ username: USERNAME })
    if (!user) throw new Error(`User "${USERNAME}" not found`)

    console.log(`Found user: ${user.username} (${user._id})`)

    const existing = await Project.find({ user: user._id }).lean()
    let project = existing.length ? pick(existing) : null

    if (!project) {
        const name = pick(PROJECT_POOL)
        project = await Project.create({ user: user._id, name })
        console.log(`  created project: ${name}`)
    } else {
        console.log(`  using project: ${project.name}`)
    }

    const times = buildStackedTimeline(TARGET_SECONDS)
    const stamp = Date.now()
    const lang = "TypeScript"

    let inserted = 0
    for (let i = 0; i < times.length; i++) {
        try {
            await Heartbeat.create({
                user: user._id,
                entity: `/home/test/${project.name}/src/session_${stamp}_${i}.ts`,
                type: "file",
                category: "coding",
                time: times[i],
                project: project._id,
                branch: "main",
                language: lang,
                is_write: true,
                ide: "vscode",
                os: "macOS",
                machine: "seed-machine",
                cursorpos: i * 10,
                lineno: i + 1,
                lines: 200
            })
            inserted++
        } catch (err: unknown) {
            const code = (err as { code?: number })?.code
            if (code !== 11000) throw err
        }
    }

    console.log(
        `  stacked ~${TARGET_SECONDS / 60}min coding on ${project.name} ` +
        `(${inserted}/${times.length} heartbeats, ending now)`
    )

    await mongoose.disconnect()
    console.log("Done.")
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
