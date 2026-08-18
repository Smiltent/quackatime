
import { optionalAuth, reqAuth } from "@/middlewares/auth.middleware.ts"
import { Request, Response, Router } from 'express'

const router = Router()
const RANGE = {
    today: 1,
    last7days: 7,
    last30days: 30,
    lastyear: 365
}

function pickRange(value: unknown) {
    const r = (
        typeof value === "string" && value in RANGE ? value : "last7days"
    ) as keyof typeof RANGE

    return { range: r, days: RANGE[r] }
}

// dashboard
router.get("/", optionalAuth, (req: Request, res: Response) => {
    const user = req.user

    if (user) {
        const { range, days } = pickRange(req.query.range)
        
        // if authenticated, show dashboard (/dashboard)
        res.render("dashboard")
    } else {
        // if unauthenticated, show lander (/)
        res.render("index")
    }

})

// projects
router.get("/my/projects", reqAuth, async (req: Request, res: Response) => {
    
})

router.get("/my/projects/:name", reqAuth, async (req: Request, res: Response) => {
    
})

// lb
router.get("/leaderboard", reqAuth, async (req: Request, res: Response) => {

})

// settings
router.get("/my/settings", reqAuth, async (req: Request, res: Response) => {

})

router.get("/my/settings/setup", reqAuth, async (req: Request, res: Response) => {

})

router.get("/my/settings/security", reqAuth, async (req: Request, res: Response) => {

})

export default router