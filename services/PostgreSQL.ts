
import { SQL } from "bun"

export const PostgreSQL = new SQL(process.env.DATABASE_URL!)