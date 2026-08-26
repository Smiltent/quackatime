
import chalk from "chalk"
import path from "path"

const YELLOW = chalk.bgHex("hsl(49, 77%, 49%)")
const ORANGE = chalk.bgHex("#f05e0a")
const BLUE = chalk.bgHex("#1e66f5")
const GRAY = chalk.bgHex("#232634")
const RED = chalk.bgHex("#d20f39")

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
})

function getTime() {
    const d = new Date()
    const ms = String(d.getMilliseconds()).padStart(3, "0")
    return `${timeFormatter.format(d)}.${ms}`
}

const SELF = import.meta.url
function getCaller() {
    const stack = new Error().stack
    if (!stack) return "unknown"

    for (const frame of stack.split("\n").slice(1)) {
        const match = 
            frame.match(/\((.*):(\d+):(\d+)\)/) ||
            frame.match(/at (.*):(\d+):(\d+)/)

        if (!match) continue

        const filePath = match[1] ?? ""
        if (filePath === SELF) continue

        return `${path.basename(filePath)}:${match[2]}` 
    }

    return "unknown"
}

export default function log(debug: boolean = false) {
    const base = (level: string, ...args: any[]) => {
        const caller = getCaller()

        process.stdout.write(
            `${level}${GRAY(` [${caller}] ${getTime()} `)} ${args}\n`
        )
    }

    console.log = (...args) => base('', ...args)
    console.info = (...args) => base(`${BLUE(' info ')}`, ...args)
    console.warn = (...args) => base(`${YELLOW(' warn ')}`, ...args)
    console.error = (...args) => base(`${RED(' error ')}`, ...args)

    if (debug) {
        console.debug = (...args) => base(`${ORANGE(' debug ')}`, ...args)
        console.debug("Debug mode is enabled")
    } else {
        console.debug = () => {}
    }
}