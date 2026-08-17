
import type { NextFunction, Request, Response } from "express"

export default function root(req: Request, res: Response, next: NextFunction) {
    res.on("finish", () => {
        console.debug(`${req.ip} | ${req.method} ${res.statusCode} ${req.originalUrl}`)
    })

    next()
}