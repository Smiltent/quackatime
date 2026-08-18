
import { optionalAuth } from "@/middlewares/auth.middleware.ts"
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

// lazy af, i want to do:
// `<a href="/logout">logout button</a>`
// instead of a POST request
router.get("/logout", optionalAuth, (req: Request, res: Response) => {
    if (!req.user) return res.redirect("/login")

    res.send(`
        <p>Logging out...</p>
        <script>    
            fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            })
            .then(res => {
                if (response.ok) {
                    window.location.href = "/"
                } else {
                    document.querySelector('p').textContent = 'Logout failed. Please try again later!'    
                }
            })
            .catch(err => {
                document.querySelector('p').textContent = 'Something went wrong...'
            })
        </script>
    `)
})

export default router