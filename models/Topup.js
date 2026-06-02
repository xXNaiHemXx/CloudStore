import mongoose from "mongoose";

const TopupSchema = new mongoose.Schema({
  // ข้อมูลผู้ใช้
  userId: { type: String, required: true },      // Discord ID
  userName: { type: String },
  
  // ข้อมูลการเติมเงิน
  amount: { type: Number, required: true },      // จำนวนเงิน (บาท)
  points: { type: Number, required: true },      // จำนวน Point ที่ได้รับ
  
  // วิธีการเติมเงิน
  method: { 
    type: String, 
    enum: ["bank", "wallet"], 
    default: "bank" 
  },
  
  // สำหรับการเติมเงินผ่านธนาคาร
  slipUrl: { type: String },                      // ลิงก์รูปสลิป
  
  // สำหรับการเติมเงินผ่าน TrueWallet อังเปา
  voucherCode: { type: String },                  // รหัสอังเปา
  provider: { type: String, default: "unknown" }, // API Provider ที่ใช้ (primary/fallback)
  
  // สถานะ
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "success"], 
    default: "pending" 
  },
  
  // ข้อมูลการอนุมัติ (สำหรับกรณีธนาคาร)
  transactionRef: { type: String },
  approvedBy: { type: String },                   // Discord ID ของ Admin ที่อนุมัติ
  approvedAt: { type: Date },
  
  // ข้อมูลเพิ่มเติม
  errorMessage: { type: String },                 // เก็บข้อความ error ถ้ามี
  createdAt: { type: Date, default: Date.now }
});

// สร้าง index เพื่อค้นหาเร็วขึ้น
TopupSchema.index({ userId: 1, createdAt: -1 });
TopupSchema.index({ method: 1, status: 1 });
TopupSchema.index({ voucherCode: 1 });

export default mongoose.models.Topup || mongoose.model("Topup", TopupSchema);