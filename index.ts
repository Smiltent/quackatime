
import Express from "@/src/Express"
import Database from "@/src/Mongo"
import log from "@/util/log"

import path from "path"
import fs from "fs"

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// args
const envArg = process.argv.find(a => a.startsWith("--env="))
const env = envArg ? `${envArg.split('=')[1]}`.toLowerCase() : "prod"

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// logging
log(env === "dev")

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const entries = fs.readdirSync("./private/ts")
    .filter(f => f.endsWith(".ts"))
    .map(f => path.join("./private/ts", f))

await Bun.build({
    entrypoints: entries,
    outdir: './public/js',
    target: 'browser',
    minify: env === "prod"
})

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
export let express: Express
async function main() {
    const db = new Database(process.env.MONGO_CONNECTION_STRING!)
    await db.ready

    express = new Express(process.env.EXPRESS_PORT!)
}

main()