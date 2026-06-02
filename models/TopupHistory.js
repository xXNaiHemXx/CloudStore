// models/TopupHistory.js
import mongoose from "mongoose";

const TopupHistorySchema = new mongoose.Schema({
  // ข้อมูลผู้ใช้
  userId: { type: String, required: true },
  userName: { type: String },
  
  // ข้อมูลการเติมเงิน
  amount: { type: Number, required: true },
  points: { type: Number, default: 0 },
  
  // วิธีการเติมเงิน
  method: { 
    type: String, 
    enum: ["bank", "wallet"], 
    default: "bank" 
  },
  
  // สำหรับ TrueWallet อังเปา
  voucherCode: { type: String },     // รหัสอังเปา
  provider: { type: String },        // API provider ที่ใช้ (primary/fallback)
  
  // สำหรับธนาคาร
  transRef: { type: String },        // Reference จาก SlipOK
  slipUrl: { type: String },         // ลิงก์รูปสลิป
  
  // สถานะ
  status: {
    type: String,
    enum: ["success", "pending", "error", "duplicate"],
    default: "pending",
  },
  
  // ข้อมูลเพิ่มเติม
  errorDetail: { type: String },     // ข้อความ error ถ้ามี
  approvedBy: { type: String },      // Admin ที่อนุมัติ (สำหรับ bank)
  approvedAt: { type: Date },        // เวลาที่อนุมัติ
  
}, { timestamps: true });

// สร้าง indexes เพื่อการ查询ที่เร็วขึ้น
TopupHistorySchema.index({ userId: 1, createdAt: -1 });
TopupHistorySchema.index({ voucherCode: 1 });
TopupHistorySchema.index({ transRef: 1 });
TopupHistorySchema.index({ method: 1, status: 1 });

export default mongoose.models.TopupHistory || mongoose.model("TopupHistory", TopupHistorySchema);