
import AuthService, { SESSION_TTL_MS } from '@/services/auth.service'
import { Router } from 'express'
const router = Router()

const cookieSettings = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_DEV !== "dev",
    maxAge: SESSION_TTL_MS
}

router.post("/login", async (req, res) => {
    const { login, password } = req.body ?? {}
    if (typeof login !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Login and Password are required!" })
    }

    const user = await AuthService.login(login.trim(), password)
    if (!user) return res.status(401).json({ error: "Invalid Credentials" })

    const token = await AuthService.createSession(user._id)

    res.cookie("session", token, cookieSettings)
    res.json({ username: user.username}) // TODO: TEMPORARY!!
})

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body ?? {}
    if (typeof username !== "string" || typeof password !== "string" || typeof email !== "string") {
        return res.status(400).json({ error: "Username, Email and Password are required!" })
    }

    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters"}) // TODO: Find a different error code for this

    const user = await AuthService.register(username.trim(), email.trim().toLowerCase(), password)
    if (!user) return res.status(400).json({ error: "Username or Email already taken!" }) // TODO: same as line 34...

    const token = await AuthService.createSession(user._id)
    await AuthService.createApiKey(user._id)

    res.cookie("session", token, cookieSettings)
    res.json({ username: user.username })
})

router.post("/logout", async (req, res) => {
    await AuthService.destroySession(req.cookies?.session)

    res.clearCookie("session")
    res.redirect("/")
})

export default router