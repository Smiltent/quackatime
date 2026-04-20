
import mongoose from "mongoose"


// Deprecated in favor of PostgreSQL.ts
export default class Mongo {
    private uri?: string = String(process.env.MONGO_URI)
    
    constructor() {
        this.connect()
    }

    private async connect() {
        try {
            if (!this.uri) {
                throw new Error(`Mongo URI is unset!`)
            }
            
            console.debug(`Connecting to Database`)
            await mongoose.connect(this.uri)

            console.info("Connected to Database")
        } catch (err) {
            console.error(`Error connecting to Database: ${err}`)
            process.exit(1)
        }
    }
}