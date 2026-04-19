
import { type Application } from 'express'
import path from 'path'
import fs from 'fs'

export default function registerRoutes(
    app: Application
) {
    const dir = path.join(__dirname, '..', '..', "routes")
    const files = fs.readdirSync(dir)

    files.forEach(async file => {
        if (!file.endsWith('.route.ts') && !file.endsWith('.route.js')) return

        const filePath = path.join(dir, file)
        const route = await import(filePath)

        if (!route.default) {
            console.warn(`Route file ${file} does not export a default route`)
            return
        }

        const routeName = file.replace(/\.(ts|js)$/, "")
        const routePath = routeName === "root.route" ? "/" : `/${routeName}`

        app.use(routePath, route.default)
        console.debug(`Loaded route: ${routePath}`)
    })
}