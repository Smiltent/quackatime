
import { SESSION_TTL_MS } from "@/util/config.ts"
import Heartbeat from "@/models/Heartbeat.ts"
import Summary from "@/models/Summary.ts"
import Session from "@/models/Session.ts"
import Project from "@/models/Project.ts"
import ApiKey from "@/models/ApiKey.ts"
import type { Types } from "mongoose"
import Goal from "@/models/Goal.ts"
import User from "@/models/User.ts"
import crypto from "node:crypto"
import bcrypt from "bcrypt"

export default class AuthService {

    //? =-=-= USER AUTHENTICATION MANAGEMENT =-=-=

    // user registration
    public static async register(username: string, email: string, password: string) {
        const exists = await User.exists({ $or: [{ username }, { email }]})
        if (exists) return null

        return User.create({
            username,
            displayName: username,
            email,
            password: await bcrypt.hash(password, 10)
        })
    }

    // user login
    public static async login(usernameOrEmail: string, password: string) {
        const user = await User.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        return valid ? user : null
    }





    //? =-=-= USER SESSIONS MANAGEMENT =-=-=
    // modify a user
    public static async updateProfile(userId: Types.ObjectId, data: { username?: string, displayName?: string, email?: string }) {
        const updates: Record<string, string> = {}

        if (data.username) {
            const username = data.username.trim()
            if (!username || username.length > 32) {
                return { error: "Username must be 1-32 characters" }
            }

            const taken = await User.exists({ username, _id: { $ne: userId }})
            if (taken) return { error: "Username already taken" }

            updates.username = username
        }

        if (data.displayName) {
            const displayName = data.displayName.trim()
            if (!displayName || displayName.length > 64) {
                return { error: "Display name must be 1-64 characters" }
            }

            updates.displayName = displayName
        }

        if (data.email) {
            const email = data.email.trim().toLowerCase()
            if (!email.includes("@")) return { error: "Invalid email" }

            const taken = await User.exists({ email, _id: { $ne: userId }})
            if (taken) return { error: "Email already taken" }

            updates.email = email
        }

        if (!Object.keys(updates).length) return { error: "Nothing to update..." }
        await User.updateOne({ _id: userId }, { $set: updates })

        return { ok: true as const }
    }

    // change a users password
    public static async changePassword(userId: Types.ObjectId, currentPass: string, nextPass: string) {
        if (!nextPass || nextPass.length < 4) {
            return { error: "New password must be at least 4 characters" }
        }

        const user = await User.findById(userId)
        if (!user) return { error: "User not found" }

        const valid = await bcrypt.compare(currentPass, user.password)
        if (!valid) return { error: "Current password is incorrect" }

        user.password = await bcrypt.hash(nextPass, 10)
        await user.save()

        return { ok: true as const }
    }

    // delete user
    public static async deleteAccount(userId: Types.ObjectId, password: string) {
        const user = await User.findById(userId)
        if (!user) return { error: "User not found" }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return { error: "Password is incorrect" }

        await Promise.all([
            Heartbeat.deleteMany({ user: userId }),
            Summary.deleteMany({ user: userId }),
            Goal.deleteMany({ user: userId }),
            Project.deleteMany({ user: userId }),
            ApiKey.deleteMany({ user: userId }),
            Session.deleteMany({ user: userId })
        ])

        await User.deleteOne({ _id: userId })
        return { ok: true as const }
    }




    //? =-=-= USER SESSIONS MANAGEMENT =-=-=

    // create a user session
    public static async createSession(userId: Types.ObjectId) {
        const token = crypto.randomBytes(32).toString("hex")

        await Session.create({
            user: userId,
            token: crypto.createHash("sha256").update(token).digest("hex"),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        })

        return token
    }
    
    // verify a user session
    public static async verifySession(token?: string) {
        if (!token) return null

        const session = await Session.findOne({
            token: crypto.createHash("sha256").update(token).digest("hex"),
            expiresAt: { $gt: new Date }
        })
        if (!session) return null

        return User.findById(session.user)
    }

    // remove a session
    public static async destroySession(token?: string) {
        if (!token) return
        await Session.deleteOne({ token: crypto.createHash("sha256").update(token).digest("hex") })
    }

    // destroy all sessions for a user
    public static async destroyAllSessions(userId: Types.ObjectId) {
        await Session.deleteMany({ user: userId })
    }





    //? =-=-= WAKATIME COMPATIBLE API KEY MANAGEMENT =-=-=

    // create a wakatime key
    public static async createApiKey(userId: Types.ObjectId) {
        const key = crypto.randomUUID()

        await ApiKey.create({ user: userId, key: crypto.createHash("sha256").update(key).digest("hex") })

        return key
    }

    // verify a wakatime key
    public static async verifyApiKey(auth?: string) {
        if (!auth) return null

        let raw
        if (auth.startsWith("Basic ")) {
            raw = Buffer.from(auth.slice(6), "base64").toString()
        } else {
            raw = auth.replace(/^Bearer\s+/i, "")
        }
        if (!raw) return null
        
        const apiKey = await ApiKey.findOne({ key: crypto.createHash("sha256").update(raw).digest("hex") })
        if (!apiKey) return null
        
        return User.findById(apiKey.user)
    }

    // regen api
    public static async regenerateApiKey(userId: Types.ObjectId) {
        await ApiKey.deleteMany({ user: userId })
        return this.createApiKey(userId)
    }

    // check if has api key
    public static async hasApiKey(userId: Types.ObjectId) {
        return Boolean(await ApiKey.exists({ user: userId }))
    }

    // revoke a wakatime key
    public static async revokeApiKey(userId: Types.ObjectId, key: string) {
        await ApiKey.deleteOne({ user: userId, key: crypto.createHash("sha256").update(key).digest("hex") })
    }
}