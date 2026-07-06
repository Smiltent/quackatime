
import AuthService from "@/services/auth.service"
import type { NextFunction, Request, Response } from "express"

export async function reqAuth(req: Request, res: Response, next: NextFunction) {
    const user = await AuthService.verifySession(req.cookies?.session)
    if (!user) return res.redirect("/login")

    req.user = user
    next()
}

export async function reqApi(req: Request, res: Response, next: NextFunction) {
    const user = await AuthService.verifyApiKey(req.headers.authorization)
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    req.user = user
    next()
}

export function reqRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" })

        next()
    }
}