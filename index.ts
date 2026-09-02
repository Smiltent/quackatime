
import Express from "@/src/Express.ts"
import Database from "@/src/Mongo.ts"
import log from "./util/log.ts"
import esbuild from "esbuild"
import path from "node:path"
import fs from "node:fs"

export const type = Deno.env.get("NODE_ENV")
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// logging
log(type === "dev")

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const entries = fs.readdirSync("./private/ts")
    .filter(f => f.endsWith(".ts"))
    .map(f => path.join("./private/ts", f))

await esbuild.build({
    entryPoints: entries,
    outdir: './public/js',
    bundle: true,
    platform: 'browser',
    minify: type === "prod"
})

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
export let express: Express
async function main() {
    const db = new Database(process.env.MONGO_URI!)
    await db.ready

    express = new Express(process.env.PORT!)
}

main()