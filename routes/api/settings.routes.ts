
import { reqAuth } from "@/middlewares/auth.middleware.ts"
import GoalsService from "@/services/goals.service.ts"
import AuthService from "@/services/auth.service.ts"
import { Request, Response, Router } from "express"

const router = Router()

const ONCE_COOKIE = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV !== "dev",
    maxAge: 5 * 60 * 1000
}

router.post("/v1/settings/profile", reqAuth, async (req: Request, res: Response) => {
    const { username, displayName, email } = req.body ?? {}

    const result = await AuthService.updateProfile(req.user!._id, {
        username: typeof username === "string" ? username : undefined,
        displayName: typeof displayName === "string" ? displayName : undefined,
        email: typeof email === "string" ? email : undefined
    })

    if ("error" in result && result.error) {
        return res.redirect(`/my/settings?err=${encodeURIComponent(result.error)}`)
    }

    res.redirect("/my/settings?ok=profile")
})

router.post("/v1/settings/password", reqAuth, async (req: Request, res: Response) => {
    const { currentPass, newPass, confirmPass } = req.body ?? {}

    if (typeof currentPass !== "string" || typeof newPass !== "string" || typeof confirmPass !== "string") {
        return res.redirect(`/my/settings/security?err=${encodeURIComponent("All password fields are required")}`)
    }
    
    if (newPass !== confirmPass) {
        return res.redirect(`/my/settings/security?err=${encodeURIComponent("New passwords do not match")}`)
    }

    const result = await AuthService.changePassword(req.user!._id, currentPass, newPass)
    if ("error" in result && result.error) {
        return res.redirect(`/my/settings/security?err=${encodeURIComponent(result.error)}`)
    }

    res.redirect(`/my/settings/security?ok=pass`)
})

router.post("/v1/settings/apiKey", reqAuth, async (req: Request, res: Response) => {
    const key = await AuthService.regenerateApiKey(req.user!._id)

    res.cookie("api_key_once", key, ONCE_COOKIE)
    res.redirect("/my/settings/setup?ok=apikey")
})

router.post("/v1/settings/goals", reqAuth, async (req: Request, res: Response) => {
    const hours = Number(req.body?.hours)
    const period = req.body?.period

    if (!Number.isFinite(hours) || hours <= 0) {
        return res.redirect(`/my/settings?err=${encodeURIComponent("Enter a valid target in hours")}`)
    }

    const result = await GoalsService.create(req.user!._id, {
        amount: Math.round(hours * 60),
        period: typeof period === "string" ? period : ""
    })

    if ("error" in result && result.error) {
        return res.redirect(`/my/settings?err=${encodeURIComponent(result.error)}`)
    }

    res.redirect("/my/settings?ok=goal")
})

router.post("/v1/settings/goals/:id/delete", reqAuth, async (req: Request, res: Response) => {
    const result = await GoalsService.remove(req.user!._id, String(req.params.id))
    if ("error" in result && result.error) {
        return res.redirect(`/my/settings?err=${encodeURIComponent(result.error)}`)
    }

    res.redirect("/my/settings?ok=delgoal")
})

router.post("/v1/settings/delete", reqAuth, async (req: Request, res: Response) => {
    const { password, confirm } = req.body ?? {}

    if (confirm !== "DELETE") {
        return res.redirect(`/my/settings?err=${encodeURIComponent("Type DELETE to confirm")}`)
    }

    if (typeof password !== "string") {
        return res.redirect(`/my/settings?err=${encodeURIComponent("Password is required")}`)
    }

    const result = await AuthService.deleteAccount(req.user!._id, password)
    if ("error" in result && result.error) {
        return res.redirect(`/my/settings?err=${encodeURIComponent(result.error)}`)
    }

    res.clearCookie("session")
    res.redirect("/login")
})

export default router