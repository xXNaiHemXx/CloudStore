import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
});

// ✅ ตรวจสอบก่อนว่าโมเดลถูกโหลดหรือยัง เพื่อป้องกันข้อผิดพลาด
const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);

export default Purchase;
