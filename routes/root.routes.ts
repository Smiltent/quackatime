
import { Request, Response, Router } from 'express'
const router = Router()

router.get("/", (_req: Request, res: Response) => {
    res.send("wait so asdasdasdas WHAT!!!!")
})

export default router