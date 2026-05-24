import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  // ... fields เดิม
  itemsname: { type: String, required: true },
  itemsprice: { type: Number, required: true },
  itemsimage: { type: String, required: true },
  itemsimages: { type: [String], default: [] },
  itemsurlyoutube: { type: String, default: "" },
  itemsdesc: { type: String, required: true },
  itemstitle: { type: String, required: true },
  itemsfile: { type: String, required: true },
  itemsversion: { type: String, required: true },
  discordRoleIds: { type: [String], default: [] },
  
  // ✅ ระบบเวอร์ชันใหม่
  currentVersion: { type: String, required: true },
  latestUpdate: { type: Date, default: Date.now },
  versionStatus: { type: String, enum: ["stable", "beta", "alpha"], default: "stable" },
  
  // สถิติ
  totalDownloads: { type: Number, default: 0 },
  totalUpdates: { type: Number, default: 0 },
  
  // แท็ก
  tags: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Item || mongoose.model("Item", itemSchema);