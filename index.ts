
import Express from "@/src/Express.ts"
import Database from "@/src/Mongo.ts"
import log from "@/util/log.ts"

// import path from "path"
// import fs from "node:fs"

const envArg = process.argv.find(a => a.startsWith("--env="))
const env = envArg ? `${envArg.split('=')[1]}`.toLowerCase() : "prod"

log(env === "dev")

// const entries = fs.readdirSync("./private/ts")
//     .filter(f => f.endsWith(".ts"))
//     .map(f => path.join("./private/ts", f))

export let express: Express
async function main() {
    const db = new Database(process.env.MONGO_URI!)
    await db.ready

    express = new Express(process.env.PORT!)
}

main()