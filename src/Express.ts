
import root from "@/middlewares/root.middleware.ts"
import expressLayouts from 'express-ejs-layouts'
import cookieParser from "cookie-parser"
import git from "@/util/githash.ts"
import express from 'express'
import path from 'node:path'

import settingsRoutes from "@/routes/api/settings.routes.ts"
import timeRoutes from "@/routes/api/time.routes.ts"
import rootRoutes from "@/routes/root.routes.ts"
import authRoutes from "@/routes/auth.routes.ts"

export default class Express {
    private app: express.Express

    constructor(private port?: number | string) {
        this.app = express()
        this.public()

        const gitt = git()
        this.app.locals.gitBranch = gitt.branch
        this.app.locals.gitHash = gitt.hash
        this.app.locals.gitUrl = gitt.url

        this.middleware()
        this.routes()
        this.start()
    }

    private middleware() {
        this.app.use(express.json())
        this.app.use(cookieParser())
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.static("public"))

        this.app.set('view engine', "ejs")
        this.app.set('layout', 'components/$layout')
        this.app.use(expressLayouts)
    }

    private async routes() {
        this.app.use(root)

        this.app.use("/", rootRoutes)
        this.app.use("/auth", authRoutes)

        this.app.use('/api', timeRoutes)
        this.app.use("/api", settingsRoutes)

        this.app.use((req, res) => {
            res.status(404).send("404")
        })
    }

    private public() {
        const isDev = process.env.NODE_ENV === "dev"

        this.app.use(
            '/public',
            express.static(path.join(import.meta.dirname!, '..', 'public'), {
                etag: !isDev,
                lastModified: !isDev,
                maxAge: isDev ? 0 : '10s',
            })
        )
    }

    private start() {
        this.app.listen(this.port, () => {
            console.info(`Server running on http://0.0.0.0:${this.port}`)
        })
    }
}