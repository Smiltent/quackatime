
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30d
export const COOKIE_SETTINGS = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_DEV !== "dev",
    maxAge: SESSION_TTL_MS
}