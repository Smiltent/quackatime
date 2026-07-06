
import root from "@/middlewares/root.middleware.ts"
import cookieParser from "cookie-parser"
import express from 'express'
import path from 'path'

import rootRoutes from "@/routes/root.routes"
import authRoutes from "@/routes/auth.routes"

export default class Express {
    private app: express.Express

    constructor(private port?: number | string) {
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

        this.app.use("/", rootRoutes)
        this.app.use("/auth", authRoutes)

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