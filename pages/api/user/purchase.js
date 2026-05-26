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
      const { userId, productId, price, finalPrice, couponCode, discount } = req.body;

      if (!userId || !productId) {
        return res.status(400).json({ error: "Missing userId or productId" });
      }

      // ✅ ใช้ finalPrice ถ้ามี (ราคาหลังหักส่วนลด)
      const actualPrice = finalPrice || price;

      // =====================================================
      // หา USER
      // =====================================================
      const user = await User.findOne({ discordId: userId });
      if (!user) return res.status(404).json({ error: "User not found" });

      // =====================================================
      // หา PRODUCT
      // =====================================================
      const product = await Item.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // =====================================================
      // ✅ ตรวจสอบคูปอง (ถ้ามี)
      // =====================================================
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        if (!coupon) {
          return res.status(400).json({ error: "ไม่พบคูปองนี้" });
        }

        // ✅ เช็คความถูกต้องของคูปอง
        const now = new Date();

        if (coupon.isActive === false) {
          return res.status(400).json({ error: "คูปองนี้ถูกปิดใช้งาน" });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          return res.status(400).json({ error: "คูปองหมดอายุแล้ว" });
        }

        if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
          return res.status(400).json({ error: "คูปองถูกใช้ครบจำนวนแล้ว" });
        }

        if (Number(price) < (coupon.minPurchase || 0)) {
          return res.status(400).json({
            error: `ต้องซื้อขั้นต่ำ ${(coupon.minPurchase || 0).toLocaleString()} Point (ปัจจุบัน ${Number(price).toLocaleString()} Point)`,
          });
        }
      }

      // =====================================================
      // เช็ค POINT
      // =====================================================
      if ((user.points || 0) < Number(actualPrice)) {
        return res.status(400).json({ error: "Point ไม่เพียงพอ" });
      }

      // =====================================================
      // หัก POINT (ใช้ actualPrice)
      // =====================================================
      user.points -= Number(actualPrice);

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
        price: Number(actualPrice),
        originalPrice: Number(price),
        couponCode: couponCode || null,
        discount: discount || 0,
      });

      user.markModified("products");
      await user.save();

      // =====================================================
      // ✅ อัปเดต usedCount ของคูปอง
      // =====================================================
      if (couponCode) {
        const updatedCoupon = await Coupon.findOneAndUpdate(
          { code: couponCode.toUpperCase() },
          { $inc: { usedCount: 1 } },
          { new: true }
        );
        console.log(`🎫 Coupon "${couponCode}" used: ${updatedCoupon?.usedCount}/${updatedCoupon?.maxUsage || '∞'}`);
      }

      // =====================================================
      // บันทึก PURCHASE HISTORY
      // =====================================================
      await Purchase.create({
        userId: user.discordId,
        userName: user.name,
        productId: product._id,
        productName: product.itemsname,
        price: Number(price),             // ราคาเต็ม
        finalPrice: Number(actualPrice),  // ราคาหลังหักส่วนลด
        couponCode: couponCode || null,
        discount: discount || 0,
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
      // ✅ Response
      // =====================================================
      return res.status(200).json({
        success: true,
        message: "ซื้อสินค้าสำเร็จ!",
        remainingPoints: user.points,
        productName: product.itemsname,
        price: Number(price),
        finalPrice: Number(actualPrice),
        couponUsed: couponCode || null,
        discount: discount || 0,
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