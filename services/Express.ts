
import loadRoutes from './express/registerRoutes'
import express from 'express'

export default class Express {
    private app: express.Express
    private port?: number | string = process.env.WEB_PORT

    constructor() {
        this.app = express()

        // automatically load all routes from /src/routes
        loadRoutes(this.app)

        this.app.listen(this.port, () => {
            console.info(`Server running on http://0.0.0.0:${this.port}`)
        })
    }
}