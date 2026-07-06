
import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    
    role: { type: String, enum: ["user", "manager", "admin"], default: "user" },
    country: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model("User", UserSchema)