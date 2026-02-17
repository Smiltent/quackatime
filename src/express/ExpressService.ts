
import loadRoutes from './routesLoader'
import { konsole } from '../..'
import express from 'express'

export default class ExpressService {
    private app: express.Express

    constructor(
        private port: String | Number = 3000
    ) {
        this.app = express()

        // automatically load all routes from /src/routes
        loadRoutes(this.app)

        this.app.listen(this.port, () => {
            konsole.info(`Server running on http://0.0.0.0:${this.port}`)
        })
    }
}