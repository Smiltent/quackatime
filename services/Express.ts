
import root from "@/middlewares/root.middleware.ts"
import loadRoutes from './express/registerRoutes'
import cookieParser from "cookie-parser"
import express from 'express'
import path from 'path'

export default class Express {
    private app: express.Express
    private port?: number | string = process.env.WEB_PORT

    constructor() {
        this.app = express()

        this.middleware()
        this.routes()
        this.public()
        this.start()
    }

    private middleware() {
        this.app.use(express.json())
        this.app.use(cookieParser())
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.static("public"))
    }

    private async routes() {
        this.app.use(root)

        await loadRoutes(this.app)

        this.app.use((req, res) => {
            res.status(404).send("404")
        })
    }

    private public() {
        const isDev = process.env.NODE_DEV === "dev"

        this.app.use(
            '/public',
            express.static(path.join(__dirname, '..', 'public'), {
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