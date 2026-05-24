import mongoose from "mongoose";

const TopupSchema = new mongoose.Schema({
  userId: { type: String, required: true },      // Discord ID
  userName: { type: String },
  amount: { type: Number, required: true },      // จำนวนเงิน (บาท)
  points: { type: Number, required: true },      // จำนวน Point ที่ได้รับ
  slipUrl: { type: String },                      // ลิงก์รูปสลิป
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  transactionRef: { type: String },
  approvedBy: { type: String },                   // Discord ID ของ Admin ที่อนุมัติ
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Topup || mongoose.model("Topup", TopupSchema);