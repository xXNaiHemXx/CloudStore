import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    points: { type: Number, default: 0 },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
            name: { type: String },
            image: { type: String },
            version: { type: String },
            fileUrl: { type: String },
            purchaseDate: { type: Date, default: Date.now },
            discordRoleIds: { type: [String], default: [] }, // ✅ เพิ่มฟิลด์นี้
        }
    ],
    loginAt: { type: Date, default: Date.now }, // ✅ เพิ่ม loginAt (optional)
});

export default mongoose.models.User || mongoose.model("User", UserSchema);