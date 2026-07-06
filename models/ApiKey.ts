
import mongoose, { Schema } from "mongoose"

const ApiKeySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model("ApiKey", ApiKeySchema)