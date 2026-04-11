
import chalk from "chalk"
import util from "util"
import path from "path"

type LogLevel = "log" | "info" | "warn" | "error" | "debug" | "dev"
export type Konsole = Record<LogLevel, (...args: unknown[]) => void>

const Colors = {
    gray: chalk.hex("#8c8c8c"),
    red: chalk.hex("#d20f39"),
    blue: chalk.hex("#1e66f5"),
    yellow: chalk.hex("#dfbc1dff"),
    orange: chalk.hex("#fe640b"),
    purple: chalk.hex("#8839ef")
}

const Levels: Record < LogLevel, { label: string; color: (text: string) => string } > = {
    log: { label: "", color: Colors.gray },
    info: { label: "[INFO]", color: Colors.blue },
    warn: { label: "[WARN]", color: Colors.yellow },
    error: { label: "[ERROR]", color: Colors.red },
    debug: { label: "[DEBUG]", color: Colors.orange },
    dev: { label: "[DEV]", color: Colors.purple }
}

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

function getCaller() {
    const stack = new Error().stack
    if (!stack) return "unknown"

    const lines = stack.split("\n")
    
    const callerLine = lines[3]
    if (!callerLine) return "unknown"

    const match = 
        callerLine.match(/\((.*):(\d+):(\d+)\)/) ||
        callerLine.match(/at (.*):(\d+):(\d+)/)

    if (!match) return "unknown"

    const filePath = match[1] ?? ""
    const line = match[2] ?? ""

    return `${path.basename(filePath)}:${line}`
}

export default function createLogger(debug?: boolean) {
    const debugMode = debug ?? false

    function write(level: LogLevel, ...args: unknown[]) {
        if (level === "debug" && !debug) return

        const caller = getCaller()
        const time = getTime()
        const formatted = util.format(...args)

        const { label, color } = Levels[level]

        const prefix =
            `${Colors.gray(`[${caller}]`)} ` +
            `${Colors.gray(time)} ` +
            (label ? `${color(label)} ` : "")

        const output = `${prefix}${formatted}\n`

        process.stdout.write(output)
    }
    
    console.log = (...args) => write("log", ...args)
    console.info = (...args) => write("info", ...args)
    console.warn = (...args) => write("warn", ...args)
    console.error = (...args) => write("error", ...args)

    if (debug) {
        console.debug = (...args) => write("debug", ...args)
        console.debug("Debug mode is enabled")
    } else {
        console.debug = () => {}
    }
}