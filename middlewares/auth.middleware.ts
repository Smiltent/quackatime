
import type { NextFunction, Request, Response } from "express"
import AuthService from "@/services/auth.service.ts"

// only allow users to authenticate (pages, etc)
export async function reqAuth(req: Request, res: Response, next: NextFunction) {
    const user = await AuthService.verifySession(req.cookies?.session)
    if (!user) return res.redirect("/login")

    req.user = user
    next()
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    // TODO: Maybe useful later, just an option
    next()
}

// only allow API keys to authenticatate (wakatime api)
export async function reqApi(req: Request, res: Response, next: NextFunction) {
    const user = await AuthService.verifyApiKey(req.headers.authorization)
    if (!user) return res.status(401).json({ error: "Unauthorized" })

    req.user = user
    next()
}

// require a role to access a page, only to users, used with l6:reqAuth() 
export function reqRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" })
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" })

        next()
    }
}