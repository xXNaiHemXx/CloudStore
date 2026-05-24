import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  points: { type: Number, default: 0 },
  products: [
    {
      productId: { type: String },
      name: { type: String },
      version: { type: String },
      image: { type: String },
      fileUrl: { type: String },
      discordRoleIds: { type: [String], default: [] },
      purchaseDate: { type: Date, default: Date.now },
      currentVersion: { type: String },        // เวอร์ชันปัจจุบันที่ user มี
      hasUpdate: { type: Boolean, default: false }, // มีอัปเดตใหม่หรือไม่
      currentVersion: { type: String }  // ✅ ต้องมี
      
    }
  ],
  loginAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);