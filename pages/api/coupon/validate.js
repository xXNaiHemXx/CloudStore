import { connectToDB } from "@/utils/db";
import Coupon from "@/models/Coupon";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectToDB();

  const { code, totalPrice } = req.body;

  if (!code) {
    return res.status(400).json({ error: "กรุณากรอกโค้ดคูปอง" });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ error: "ไม่พบโค้ดคูปองนี้" });
    }

    // เช็ควันหมดอายุ
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: "คูปองหมดอายุแล้ว" });
    }

    // เช็คจำนวนการใช้
    if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
      return res.status(400).json({ error: "คูปองถูกใช้ครบจำนวนแล้ว" });
    }

    // เช็คขั้นต่ำ
    if (totalPrice && totalPrice < coupon.minPurchase) {
      return res.status(400).json({ 
        error: `ต้องซื้อขั้นต่ำ ${coupon.minPurchase.toLocaleString()} Point (ปัจจุบัน ${totalPrice.toLocaleString()} Point)` 
      });
    }

    // คำนวณส่วนลด
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((totalPrice * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    const finalPrice = Math.max(0, totalPrice - discount);

    return res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: discount,
        finalPrice: finalPrice,
      },
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}