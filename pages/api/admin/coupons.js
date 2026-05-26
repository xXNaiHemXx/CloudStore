import { connectToDB } from "@/utils/db";
import Coupon from "@/models/Coupon";

export default async function handler(req, res) {
  await connectToDB();

  // GET - ดึงคูปองทั้งหมด
  if (req.method === "GET") {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      return res.status(200).json({ coupons });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - สร้างคูปองใหม่
  if (req.method === "POST") {
    try {
      const { code, description, discountType, discountValue, minPurchase, maxUsage, expiresAt } = req.body;
      
      if (!code || !discountValue) {
        return res.status(400).json({ error: "กรุณากรอกโค้ดและส่วนลด" });
      }

      // เช็คโค้ดซ้ำ
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ error: "โค้ดนี้มีอยู่แล้ว" });
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchase,
        maxUsage,
        expiresAt: expiresAt || null,
      });

      return res.status(201).json({ success: true, coupon });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - แก้ไขคูปอง
  if (req.method === "PUT") {
    try {
      const { id, ...updateData } = req.body;
      const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
      return res.status(200).json({ success: true, coupon });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - ลบคูปอง
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      await Coupon.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}