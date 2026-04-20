
import type { NextFunction, Request, Response } from "express"

export default async function root(req: Request, res: Response, next: NextFunction) {
    next()
    console.debug(`${req.ip} | ${req.method} ${res.statusCode} ${req.originalUrl}`)
}