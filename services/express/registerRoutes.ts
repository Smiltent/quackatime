
import { type Application } from 'express'
import path from 'path'
import fs from 'fs'

export default async function registerRoutes(app: Application) {
    const dir = path.join(__dirname, '..', '..', "routes")
    const files = fs.readdirSync(dir).filter(f => {
        return f.endsWith(".routes.ts")
    })

    for (const file of files) {
        const fPath = path.join(dir, file)

        const name = path.basename(file)
            .replace(/\.routes.ts$/, "")
            .replace(".", "/")

        const mount = name === "root" ? "/" : `/${name}`

        try {
            const mod = await import(fPath)
            const router = mod.default

            if (!router || typeof router !== "function") {
                console.warn(`Skipping ${file} - no default export!`)
                continue
            }

            app.use(mount, router)
            console.debug(`Mounted ${file} -> ${mount}`)
        } catch (err) {
            console.error(`Failed to load ${file}: ${err}`)
        }
    }
}