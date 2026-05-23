import mongoose from "mongoose";

const StatsSchema = new mongoose.Schema({
    purchases: { type: Number, default: 0 }, // ✅ จำนวนสินค้าที่ถูกซื้อทั้งหมด
});

export default mongoose.models.Stats || mongoose.model("Stats", StatsSchema);
