
import type { NextFunction, Request, Response } from "express"

export function reqAuth(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.user?.id) {
        
    }
}

export function reqApi(req: Request, res: Response, next: NextFunction) {

}

export function loadUser(req: Request, res: Response, next: NextFunction) {

}

export function reqAuthRedirect(req: Request, res: Response, next: NextFunction) {
    
}
