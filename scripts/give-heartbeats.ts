
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import User from "@/models/User.ts"
import Project from "@/models/Project.ts"
import Heartbeat from "@/models/Heartbeat.ts"

const USER_COUNT = 10
const PASSWORD = "seedpass123"

const PROJECT_POOL = [
    "quackatime", "duckpond", "nest-api", "feather-ui", "mallard-cli",
    "waddle-bot", "bill-tracker", "pond-sync", "egg-timer", "flock-db"
]

const OS_POOL = ["Linux", "macOS", "Windows", "FreeBSD", "ChromeOS"]
const IDE_POOL = ["vscode", "neovim", "jetbrains", "zed", "emacs", "sublime"]
const LANG_POOL = [
    "TypeScript", "JavaScript", "Python", "Go", "Rust",
    "Java", "C++", "Ruby", "Swift", "HTML"
]

const EXT: Record<string, string> = {
    TypeScript: "ts",
    JavaScript: "js",
    Python: "py",
    Go: "go",
    Rust: "rs",
    Java: "java",
    "C++": "cpp",
    Ruby: "rb",
    Swift: "swift",
    HTML: "html"
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
}

function sample<T>(arr: T[], n: number): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
    }
    return copy.slice(0, n)
}

function randInt(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min + 1))
}

/** Heartbeats spaced so StatsService.durations sums ≈ targetSeconds. */
function buildTimeline(targetSeconds: number) {
    const interval = randInt(45, 90)
    const count = Math.max(2, Math.ceil((targetSeconds - 30) / interval) + 1)
    const span = (count - 1) * interval

    // Scatter sessions across the last 7 days
    const now = Math.floor(Date.now() / 1000)
    const weekAgo = now - 7 * 86400
    const latestStart = now - span - 60
    const start = randInt(weekAgo, Math.max(weekAgo, latestStart))

    const times: number[] = []
    for (let i = 0; i < count; i++) {
        times.push(start + i * interval + randInt(0, 5))
    }
    return times
}

async function ensureUser(index: number) {
    const username = `seed_user_${String(index).padStart(2, "0")}`
    const email = `${username}@seed.local`

    let user = await User.findOne({ username })
    if (user) {
        console.log(`  user exists: ${username}`)
        return user
    }

    user = await User.create({
        username,
        displayName: `Seed ${index}`,
        email,
        password: await bcrypt.hash(PASSWORD, 10)
    })
    console.log(`  created user: ${username}`)
    return user
}

async function ensureProjects(userId: mongoose.Types.ObjectId, names: string[]) {
    const ids: { name: string, id: mongoose.Types.ObjectId }[] = []

    for (const name of names) {
        const project = await Project.findOneAndUpdate(
            { user: userId, name },
            { $setOnInsert: { user: userId, name } },
            { upsert: true, new: true }
        )
        ids.push({ name, id: project._id })
    }

    return ids
}

async function seedUser(index: number, oses: string[], ides: string[], langs: string[]) {
    const user = await ensureUser(index)
    const projects = await ensureProjects(user._id, sample(PROJECT_POOL, 3))
    const hours = randInt(1, 10)
    const minutes = randInt(0, 59)
    const targetSeconds = hours * 3600 + minutes * 60
    const times = buildTimeline(targetSeconds)

    const docs = times.map((time, i) => {
        const lang = pick(langs)
        const project = pick(projects)
        const file = `src/${pick(["main", "index", "app", "util", "service"])}_${i}.${EXT[lang] ?? "txt"}`

        return {
            user: user._id,
            entity: `/Users/seed/${project.name}/${file}`,
            type: "file" as const,
            category: "coding" as const,
            time,
            project: project.id,
            branch: pick(["main", "dev", "feature/seed"]),
            language: lang,
            is_write: Math.random() > 0.3,
            ide: pick(ides),
            os: pick(oses),
            machine: `seed-machine-${index}`,
            cursorpos: randInt(0, 120),
            lineno: randInt(1, 400),
            lines: randInt(20, 800)
        }
    })

    // Avoid unique (user, entity, time) collisions on re-runs
    let inserted = 0
    for (const doc of docs) {
        try {
            await Heartbeat.create(doc)
            inserted++
        } catch (err: unknown) {
            const code = (err as { code?: number })?.code
            if (code !== 11000) throw err
        }
    }

    console.log(
        `  ${user.username}: ~${hours}h ${minutes}m across ${projects.map(p => p.name).join(", ")} ` +
        `(${inserted}/${docs.length} heartbeats)`
    )
}

async function main() {
    const uri = process.env.MONGO_URI
    if (!uri) throw new Error("MONGO_URI is unset — run with --env-file")

    console.log("Connecting…")
    await mongoose.connect(uri)

    const oses = sample(OS_POOL, 3)
    const ides = sample(IDE_POOL, 3)
    const langs = sample(LANG_POOL, 3)

    console.log(`OSes: ${oses.join(", ")}`)
    console.log(`IDEs: ${ides.join(", ")}`)
    console.log(`Languages: ${langs.join(", ")}`)
    console.log(`Seeding ${USER_COUNT} users…`)

    for (let i = 1; i <= USER_COUNT; i++) {
        await seedUser(i, oses, ides, langs)
    }

    await mongoose.disconnect()
    console.log("Done. Seed passwords:", PASSWORD)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
