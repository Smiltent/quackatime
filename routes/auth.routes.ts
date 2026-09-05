
import { optionalAuth } from "@/middlewares/auth.middleware.ts"
import AuthService from '@/services/auth.service.ts'
import { Request, Response, Router } from 'express'
import { COOKIE_SETTINGS } from "@/util/config.ts"

const router = Router()

router.post("/login", async (req: Request, res: Response) => {
    const { login, password } = req.body ?? {}

    const fail = (status: number, error: string) =>
        res.status(status).render("auth/login", { error, login })

    if (typeof login !== "string" || typeof password !== "string") {
        return fail(400, "Login and Password are required!")
    }

    // validate
    const user = await AuthService.login(login.trim(), password)
    if (!user) return fail(401, "Invalid Credentials")

    // create token
    const token = await AuthService.createSession(user._id)

    res.cookie("session", token, COOKIE_SETTINGS)
    res.redirect("/")
})

router.post("/register", async (req: Request, res: Response) => {
    const { username, email, password } = req.body ?? {}

    const fail = (status: number, error: string) =>
        res.status(status).render("auth/register", { error, username, email })

    if (typeof username !== "string" || typeof password !== "string" || typeof email !== "string") {
        return fail(400, "Username, Email and Password are required!")
    }

    // create the user
    const user = await AuthService.register(username.trim(), email.trim().toLowerCase(), password)
    if (!user) return fail(400, "Username or Email already taken!")

    // create the session
    const token = await AuthService.createSession(user._id)

    // create a wakatime compatible api key
    await AuthService.createApiKey(user._id)

    res.cookie("session", token, COOKIE_SETTINGS)
    res.redirect("/")
})

router.post("/logout", async (req: Request, res: Response) => {
    await AuthService.destroySession(req.cookies?.session)

    res.clearCookie("session")
    res.redirect("/")
})

// pages
router.get("/login", optionalAuth, (req: Request, res: Response) => {
    if (req.user) return res.redirect("/")

    res.render("login", {
        error: typeof req.query.error === "string" ? req.query.error : null
    })
})

router.get("/register", optionalAuth, (req: Request, res: Response) => {
    if (req.user) return res.redirect("/")

    res.render("register", {
        error: typeof req.query.error === "string" ? req.query.error : null
    })
})

export default router