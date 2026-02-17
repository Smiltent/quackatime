
import express from 'express'
import path from 'path'
import fs from 'fs'
import { konsole } from '../..'

export default function loadRoutes(
    app: express.Express
) {
    const routesPath = path.join(__dirname, '..', "routes")
    const files = fs.readdirSync(routesPath)

    files.forEach(async file => {
        if (!file.endsWith('.route.ts') && !file.endsWith('.route.js')) return

        const filePath = path.join(routesPath, file)
        const route = await import(filePath)

        if (!route.default) {
            konsole.warn(`Route file ${file} does not export a default route`)
            return
        }

        const routeName = file.replace(/\.(ts|js)$/, "")
        const routePath = routeName === "index.route" ? "/" : `/${routeName}`

        app.use(routePath, route.default)
        konsole.debug(`Loaded route: ${routePath}`)
    })
}