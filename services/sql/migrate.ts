
import { db } from "@/index"
import path from "path"
import fs from "fs"

export default async function runMigrations() {
    await db`
        CREATE TABLE IF NOT EXISTS _migrations (
            name TEXT PRIMARY KEY,
            ran_at TIMESTAMPTZ DEFAULT NOW()
        )    
    `

    const ran = new Set(
        (await db`SELECT name FROM _migrations`)
            .map((r: any) => r.name)
    )

    const dir = path.join(__dirname, "migrations")
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith(".sql"))
        .sort()

    try {
        for (const file of files) {
            if (ran.has(file)) continue

            console.debug(`Running migration: ${file}`)
            
            const sql = fs.readFileSync(path.join(dir, file), "utf8")
            await db.unsafe(sql)
            await db`INSERT INTO _migrations (name) VALUES (${file})`

            console.debug(`Done: ${file}`)
        }

        console.info(`Migrations completed!`)
    } catch (err) {
        console.error(`Failed migration: ${err}`)
    }
}