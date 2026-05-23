import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    points: { type: Number, default: 0 }, // ✅ Point ของผู้ใช้
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, // ✅ ID สินค้าที่ซื้อ
            name: { type: String },
            image: { type: String },
            version: { type: String },
            fileUrl: { type: String },
            purchaseDate: { type: Date, default: Date.now }, // ✅ วันเวลาที่ซื้อ
        }
    ],
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
