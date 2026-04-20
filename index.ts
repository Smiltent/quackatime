
import Express from "@/services/Express"
import Mongo from "@/services/Mongo"
import log from "@/util/log"

import path from "path"
import fs from "fs"

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// args
const envArg = process.argv.find(a => a.startsWith("--env="))
const env = envArg ? `.${envArg.split('=')[1]}`.toLowerCase() : ''

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// environment config
require("dotenv").config({ 
    path: `.env${env}`
})

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// logging
log(env === ".dev")

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// build for web
const entries = fs.readdirSync("./private/ts")
    .filter(f => f.endsWith(".ts"))
    .map(f => path.join("./private/ts", f))

await Bun.build({
    entrypoints: entries,
    outdir: './public/js',
    target: 'browser',
    minify: env == "prod"
})


//
// makes the services public
// 
// incase of future use, where there might be a need to 
// access services from different parts of the code
//
export const expressService = new Express()
export const databaseService = new Mongo()
