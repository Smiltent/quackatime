
import Session from "@/models/Session"
import type { Types } from "mongoose"
import ApiKey from "@/models/ApiKey"
import User from "@/models/User"
import crypto from "crypto"

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30d

export default class AuthService {
    // authentication
    public static async register(username: string, email: string, password: string) {
        const exists = await User.exists({ $or: [{ username }, { email }]})
        if (exists) return null

        return User.create({
            username,
            email,
            password: await Bun.password.hash(password)
        })
    }

    public static async login(usernameOrEmail: string, password: string) {
        const user = await User.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        })
        if (!user) return null

        const valid = await Bun.password.verify(password, user.password)
        return valid ? user : null
    }

    // sessions
    public static async createSession(userId: Types.ObjectId) {
        const token = crypto.randomBytes(32).toString("hex")

        await Session.create({
            user: userId,
            token: crypto.createHash("sha256").update(token).digest("hex"),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        })

        return token
    }

    public static async verifySession(token?: string) {
        if (!token) return null

        const session = await Session.findOne({
            token: crypto.createHash("sha256").update(token).digest("hex"),
            expiresAt: { $gt: new Date }
        })
        if (!session) return null

        return User.findById(session.user)
    }

    public static async destroySession(token?: string) {
        if (!token) return
        await Session.deleteOne({ token: crypto.createHash("sha256").update(token).digest("hex") })
    }

    public static async destroyAllSessions(userId: Types.ObjectId) {
        await Session.deleteMany({ user: userId })
    }

    // wakatime compatible api keys
    public static async createApiKey(userId: Types.ObjectId) {
        const key = crypto.randomUUID()

        await ApiKey.create({ user: userId, key: crypto.createHash("sha256").update(key).digest("hex") })

        return key
    }

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

    public static async revokeApiKey(userId: Types.ObjectId, key: string) {
        await ApiKey.deleteOne({ user: userId, key: crypto.createHash("sha256").update(key).digest("hex") })
    }
}