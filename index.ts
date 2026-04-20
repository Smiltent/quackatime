
import { PostgreSQL } from "@/services/PostgreSQL"
import runMigrations from "@/services/sql/migrate"
import Express from "@/services/Express"
import log from "@/util/log"

import path from "path"
import fs from "fs"

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// args
const envArg = process.argv.find(a => a.startsWith("--env="))
const env = envArg ? `.${envArg.split('=')[1]}`.toLowerCase() : ''

const migArg = process.argv.find(a => a.startsWith("--migration"))
const mig = migArg ? true : false

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// environment config
require("dotenv").config({ 
    path: `.env${env}`
})

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

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// services
export const express = new Express()
export const db = PostgreSQL

// migrations
if (mig) { 
    runMigrations() 
}