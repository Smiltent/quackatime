
import type { ObjectId } from "mongoose"
export {}

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: ObjectId;
                username: string;
                email: string;
                role: string;
                country: string;
            }
        }
    }
}