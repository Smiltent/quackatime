
import mongoose from "mongoose"

export default class Mongo {
    
    constructor(
        private uri: string
    ) {
        this.connect()
    }

    private async connect() {
        try {
            console.debug(`Connecting to Database`)
            await mongoose.connect(this.uri)

            console.info("Connected to Database")
        } catch (err) {
            console.error("Error connecting to database, exiting...")
            console.error(err)
            process.exit(1)
        }
    }
}