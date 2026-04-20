
import { db } from "@/index"

export type UserRole = 'default' | 'privilaged' | 'manager' | 'admin'
export interface User {
    id: number;
    username: string;
    password: string;
    roles: UserRole[];
    created_at: Date;
}

export const UserModel = {
    findById: (id: number) =>
        db`SELECT * FROM users WHERE id = ${id}`,

    create: async (data: User & { password: string }) => {
        const hash = await Bun.password.hash(data.password)

        db`
            INSERT INTO users (username, password, roles) 
            VALUES (${data.username}, ${hash}, ${data.roles ?? ['default']}) 
            RETURNING *
        `
    }

}