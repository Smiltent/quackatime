
// turning seconds into readable time
// doesnt add seconds, just rounds it down
// 1000s => 16mins
export function human(sec: number) {
    const total = Math.round(sec)
    const hrs = Math.floor(total / 3600)
    const mins = Math.floor((total % 3600) / 60)

    if (!hrs && !mins) return `${total} secs`
    if (!hrs) return `${mins} min${mins === 1 ? "" : "s"}`
    if (!mins) return `${hrs} hr${mins === 1 ? "" : "s"}`

    return `${hrs} hr${hrs === 1 ? "" : "s"} ${mins} min${mins === 1 ? "" : "s"}`
}

// 1000s -> 0:16
export function digital(sec: number) {
    const total = Math.round(sec)
    return `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}`
}

export function dayKey(unix: number) {
    return dateKey(new Date(unix * 1000))
}

export function dateKey(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
}

export function startOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(0,0,0,0)
    return d
}

export function endOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(23,59,59,999)
    return d
}

export function addDays(date: Date, days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

export function eachDay(start: Date, end: Date) {
    const days: Date[] = []

    for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) {
        days.push(d)
    }

    return days
}