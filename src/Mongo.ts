
import mongoose from "mongoose"

export default class Mongo {    
    public ready: Promise<void>

    constructor(private uri?: string) {
        this.ready = this.connect()
    }

    private async connect() {
        try {
            if (!this.uri) {
                throw new Error(`Mongo URI is unset!`)
            }
            
            console.debug(`Connecting to Database...`)
            await mongoose.connect(this.uri, {
                maxPoolSize: 20
            })

            console.info("Connected to Database")
        } catch (err) {
            console.error(`Error connecting to Database: ${err}`)
            process.exit(1)
        }
    }
}