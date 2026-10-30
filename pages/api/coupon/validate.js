import { connectToDB } from "@/utils/db";
import Coupon from "@/models/Coupon";
import { rateLimit } from "@/utils/apiGuard";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // กันการสุ่มเดาโค้ดคูปอง
  if (!rateLimit(req, res, { key: "coupon", limit: 15 })) return;

  await connectToDB();

  const { code, totalPrice, productId } = req.body || {};

  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "กรุณากรอกโค้ดคูปอง" });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ error: "ไม่พบโค้ดคูปองนี้" });
    }

    // ✅ ใช้ Method ตรวจสอบ (รวมทุกอย่างแล้ว)
    const result = coupon.checkValidity(totalPrice || 0, productId);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      coupon: result.coupon,
    });

  } catch (error) {
    console.error("Validate coupon error:", error);
    return res.status(500).json({ error: error.message });
  }
}