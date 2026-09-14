import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Item from "../../../models/items";
import Purchase from "../../../models/Purchase";
import Coupon from "../../../models/Coupon";
import { addDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {
  await connectToDB();

  // =====================================================
  // GET = ดึงรายการคำสั่งซื้อทั้งหมด
  // =====================================================
  if (req.method === "GET") {
    try {
      const purchases = await Purchase.find({}).sort({ purchaseDate: -1 });

      const purchasesWithUser = await Promise.all(
        purchases.map(async (purchase) => {
          const user = await User.findOne({ discordId: purchase.userId });
          return {
            _id: purchase._id,
            productId: purchase.productId,
            productName: purchase.productName,
            price: purchase.price,
            finalPrice: purchase.finalPrice,
            couponCode: purchase.couponCode,
            discount: purchase.discount,
            purchaseDate: purchase.purchaseDate,
            buyerId: purchase.userId,
            buyerName: user?.name || purchase.userName || "Unknown",
          };
        })
      );

      return res.status(200).json(purchasesWithUser || []);
    } catch (error) {
      console.error("GET PURCHASE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =====================================================
  // POST = ซื้อสินค้า
  // =====================================================
  if (req.method === "POST") {
    try {
      // ⚠️ SECURITY FIX: ไม่รับ price / finalPrice / discount จาก client อีกต่อไป
      // รับแค่ userId, productId, couponCode เท่านั้น ราคาทั้งหมดคำนวณจาก DB ฝั่งเซิร์ฟเวอร์
      const { userId, productId, couponCode } = req.body;

      if (!userId || !productId) {
        return res.status(400).json({ error: "Missing userId or productId" });
      }

      // =====================================================
      // หา USER
      // =====================================================
      const user = await User.findOne({ discordId: userId });
      if (!user) return res.status(404).json({ error: "User not found" });

      // =====================================================
      // หา PRODUCT — ราคาจริงต้องมาจาก DB เท่านั้น ห้ามเชื่อ client เด็ดขาด
      // =====================================================
      const product = await Item.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const realPrice = Number(product.itemsprice || 0);
      if (realPrice < 0 || Number.isNaN(realPrice)) {
        return res.status(400).json({ error: "ราคาสินค้าไม่ถูกต้อง" });
      }

      // =====================================================
      // ✅ กันซื้อซ้ำ (ถ้ามีสินค้านี้อยู่แล้วในบัญชี)
      // =====================================================
      const alreadyOwned = (user.products || []).some(
        (p) => p.productId?.toString() === product._id.toString()
      );
      if (alreadyOwned) {
        return res.status(400).json({ error: "คุณมีสินค้านี้อยู่แล้ว" });
      }

      // =====================================================
      // ✅ ตรวจสอบคูปอง (ถ้ามี) — ใช้ realPrice จาก DB ในการคำนวณทุกจุด
      // =====================================================
      let actualPrice = realPrice;
      let discount = 0;
      let normalizedCouponCode = null;

      if (couponCode) {
        const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });

        if (!coupon) {
          return res.status(400).json({ error: "ไม่พบคูปองนี้" });
        }

        // ใช้ method เดียวกับ /api/coupon/validate เพื่อให้ผลลัพธ์ตรงกันเสมอ
        // (เช็ค isActive, expiresAt, maxUsage, minPurchase, productRestriction ให้ในตัว)
        const result = coupon.checkValidity(realPrice, productId);

        if (!result.valid) {
          return res.status(400).json({ error: result.error });
        }

        discount = result.coupon.discount;
        actualPrice = result.coupon.finalPrice;
        normalizedCouponCode = coupon.code;
      }

      // =====================================================
      // เช็ค POINT
      // =====================================================
      if ((user.points || 0) < actualPrice) {
        return res.status(400).json({ error: "Point ไม่เพียงพอ" });
      }

      // =====================================================
      // หัก POINT (ใช้ actualPrice ที่คำนวณเองฝั่งเซิร์ฟเวอร์)
      // =====================================================
      user.points -= actualPrice;

      // =====================================================
      // เพิ่มสินค้าใน USER
      // =====================================================
      if (!user.products) user.products = [];

      user.products.push({
        productId: product._id,
        name: product.itemsname,
        version: product.itemsversion,
        fileUrl: product.itemsfile,
        image: product.itemsimage || "",
        itemsimages: product.itemsimages || [],
        discordRoleIds: product.discordRoleIds || [],
        purchasedAt: new Date(),
        price: actualPrice,
        originalPrice: realPrice,
        couponCode: normalizedCouponCode,
        discount,
      });

      user.markModified("products");
      await user.save();

      // =====================================================
      // ✅ อัปเดต usedCount ของคูปอง
      // =====================================================
      if (normalizedCouponCode) {
        const updatedCoupon = await Coupon.findOneAndUpdate(
          { code: normalizedCouponCode },
          { $inc: { usedCount: 1 } },
          { new: true }
        );
        console.log(`🎫 Coupon "${normalizedCouponCode}" used: ${updatedCoupon?.usedCount}/${updatedCoupon?.maxUsage || '∞'}`);
      }

      // =====================================================
      // บันทึก PURCHASE HISTORY — ราคาที่บันทึกต้องมาจาก DB เท่านั้น
      // =====================================================
      await Purchase.create({
        userId: user.discordId,
        userName: user.name,
        productId: product._id,
        productName: product.itemsname,
        price: realPrice,           // ราคาเต็มจริงจาก DB
        finalPrice: actualPrice,    // ราคาหลังหักส่วนลดที่คำนวณเองฝั่งเซิร์ฟเวอร์
        couponCode: normalizedCouponCode,
        discount,
        purchaseDate: new Date(),
      });

      // =====================================================
      // เพิ่ม DISCORD ROLE
      // =====================================================
      if (product.discordRoleIds && product.discordRoleIds.length > 0) {
        console.log(`📌 กำลังเพิ่ม Role ${product.discordRoleIds.join(", ")} ให้ ${user.discordId}...`);
        try {
          await addDiscordRoles(user.discordId, product.discordRoleIds);
          console.log(`✅ เพิ่ม Role สำเร็จ`);
        } catch (roleError) {
          console.error("⚠️ เพิ่ม Role ไม่สำเร็จ:", roleError.message);
          // ไม่ throw error เพราะซื้อสำเร็จแล้ว
        }
      }

      // =====================================================
      // ✅ แจ้งเตือน Discord จากฝั่งเซิร์ฟเวอร์โดยตรง
      // (ไม่พึ่ง client ยิง webhook เอง เพราะ endpoint ดึง URL webhook ต้องเป็น admin เท่านั้น
      //  ทำให้ลูกค้าทั่วไปแจ้งเตือนไม่เคยสำเร็จมาก่อน — ดูรายละเอียดใน utils/notifyPurchase.js)
      // =====================================================
      try {
        const { notifyPurchase } = await import("../../../utils/notifyPurchase");
        await notifyPurchase({
          discordId: user.discordId,
          userName: user.name,
          productName: product.itemsname,
          version: product.itemsversion,
          price: actualPrice,
          roleIds: product.discordRoleIds || [],
        });
      } catch (notifyError) {
        console.error("⚠️ ส่งแจ้งเตือน Discord ไม่สำเร็จ:", notifyError.message);
        // ไม่ throw error เพราะซื้อสำเร็จแล้ว ไม่ควรทำให้ลูกค้าซื้อของไม่ผ่าน
      }

      // =====================================================
      // ✅ บันทึก log บนเว็บ (เก็บไว้เหมือนเดิมเพื่อดูใน Admin panel)
      // =====================================================
      try {
        const { writeLogDirect } = await import("../../../utils/serverLogWriter");
        await writeLogDirect(
          "purchase",
          "ซื้อสินค้า",
          `${user.name} ซื้อ "${product.itemsname}" ราคา ${actualPrice} Point${normalizedCouponCode ? ` (ใช้คูปอง ${normalizedCouponCode} ลด ${discount})` : ''}`,
          user.name,
          {
            discordId: user.discordId,
            productName: product.itemsname,
            price: actualPrice,
            version: product.itemsversion,
            roleIds: product.discordRoleIds || [],
          }
        );
      } catch (logError) {
        console.error("⚠️ บันทึก log ไม่สำเร็จ:", logError.message);
      }

      // =====================================================
      // ✅ Response
      // =====================================================
      return res.status(200).json({
        success: true,
        message: "ซื้อสินค้าสำเร็จ!",
        remainingPoints: user.points,
        productName: product.itemsname,
        price: realPrice,
        finalPrice: actualPrice,
        couponUsed: normalizedCouponCode,
        discount,
      });

    } catch (error) {
      console.error("PURCHASE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================
  return res.status(405).json({ error: "Method not allowed" });
}