
import type { Types } from "mongoose"
export {}

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: Types.ObjectId;
                username: string;
                displayName: string;
                email: string;
                role: string;
                country?: string | null;
            }
        }
    }
}