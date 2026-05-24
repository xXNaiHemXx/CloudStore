import mongoose from "mongoose";

const ProductVersionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  version: { type: String, required: true },
  title: { type: String, required: true },
  changelog: [{ type: String }], // Array ของข้อความ
  downloadUrl: { type: String, required: true },
  fileSize: { type: String, default: "0 MB" },
  fileHash: { type: String }, // SHA256 hash
  releaseType: { type: String, enum: ["major", "minor", "hotfix"], default: "minor" },
  status: { type: String, enum: ["stable", "beta", "alpha", "deprecated"], default: "stable" },
  isImportant: { type: Boolean, default: false },
  isForceUpdate: { type: Boolean, default: false },
  screenshots: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  publishedBy: { type: String }, // Discord ID ของ admin
  downloadCount: { type: Number, default: 0 }
});

export default mongoose.models.ProductVersion || mongoose.model("ProductVersion", ProductVersionSchema);