
import path from "node:path"
import fs from "node:fs"

const DIR = path.join(import.meta.dirname!, "..", ".git")

export default function git() {
    try {
        const head = fs.readFileSync(path.join(DIR, "HEAD"), "utf8").trim()
        
        const ref = head.startsWith("ref:") ? head.slice(4).trim() : ""
        const hash = head.startsWith("ref:")
            ? fs.readFileSync(path.join(DIR, ref), "utf8").trim()
            : head

        return {
            branch: ref,
            hash: hash.substring(0, 8),
            url: `https://github.com/Smiltent/quackatime/commit/${hash}`
        }
    } catch (err) {
        console.error(`Error fetching git hash from .git folder (git might not be installed): ${err}`)
        return {
            hash: "unknown",
            url: "#"
        }
    }
}
