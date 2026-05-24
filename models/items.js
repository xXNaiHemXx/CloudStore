import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
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
  
  // ✅ ระบบเวอร์ชันใหม่ (เปลี่ยน required เป็น false หรือลบ required)
  currentVersion: { type: String, default: "" },  // ← เปลี่ยนจาก required: true เป็น default: ""
  latestUpdate: { type: Date, default: Date.now },
  versionStatus: { type: String, enum: ["stable", "beta", "alpha"], default: "stable" },
  
  // สถิติ
  totalDownloads: { type: Number, default: 0 },
  totalUpdates: { type: Number, default: 0 },
  
  // แท็ก
  tags: [{ type: String }],
  
  versionHistory: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model("Item", itemSchema);