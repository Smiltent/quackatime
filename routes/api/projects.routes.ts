import { reqAuth } from "@/middlewares/auth.middleware.ts"
import { Router, Request, Response } from "express"
import Project from "@/models/Project.ts"

const router = Router()

router.post("/v1/projects/:name/archive", reqAuth, async (req: Request, res: Response) => {
    const user = req.user!
    const name = decodeURIComponent(String(req.params.name))

    await Project.findOneAndUpdate(
        { user: user._id, name },
        { $set: { archived: true }}
    )

    res.redirect("/my/projects")
})

router.post("/v1/projects/:name/unarchive", reqAuth, async (req: Request, res: Response) => {
    const user = req.user!
    const name = decodeURIComponent(String(req.params.name))

    await Project.findOneAndUpdate(
        { user: user._id, name },
        { $set: { archived: false }}
    )

    res.redirect("/my/projects?show=archived")
})

export default router
