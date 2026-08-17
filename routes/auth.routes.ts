
import AuthService from '@/services/auth.service.ts'
import { Request, Response, Router } from 'express'
import { COOKIE_SETTINGS } from "@/util/config.ts"

const router = Router()

router.post("/login", async (req: Request, res: Response) => {
    const { login, password } = req.body ?? {}
    if (typeof login !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Login and Password are required!" })
    }

    // validate
    const user = await AuthService.login(login.trim(), password)
    if (!user) return res.status(401).json({ error: "Invalid Credentials" })

    // create token
    const token = await AuthService.createSession(user._id)

    res.cookie("session", token, COOKIE_SETTINGS)
    res.json({ username: user.username})
})

router.post("/register", async (req: Request, res: Response) => {
    const { username, email, password } = req.body ?? {}
    if (typeof username !== "string" || typeof password !== "string" || typeof email !== "string") {
        return res.status(400).json({ error: "Username, Email and Password are required!" })
    }

    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters"})

    // create the user
    const user = await AuthService.register(username.trim(), email.trim().toLowerCase(), password)
    if (!user) return res.status(400).json({ error: "Username or Email already taken!" })

    // create the session
    const token = await AuthService.createSession(user._id)

    // create a wakatime compatible api key
    await AuthService.createApiKey(user._id)

    res.cookie("session", token, COOKIE_SETTINGS)
    res.json({ username: user.username })
})

router.post("/logout", async (req: Request, res: Response) => {
    await AuthService.destroySession(req.cookies?.session)

    res.clearCookie("session")
    res.redirect("/")
})

export default router