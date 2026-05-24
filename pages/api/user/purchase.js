import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Item from "../../../models/Items";
import Purchase from "../../../models/Purchase";
import { addDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {

  await connectToDB();

  // =====================================================
  // GET = ดึงรายการคำสั่งซื้อทั้งหมด
  // =====================================================

  if (req.method === "GET") {

  try {

    const purchases = await Purchase.find({})
      .sort({ purchaseDate: -1 });

    // ✅ ดึงข้อมูลผู้ใช้เพิ่มเติมสำหรับแต่ละคำสั่งซื้อ
    const purchasesWithUser = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await User.findOne({ discordId: purchase.userId });
        return {
          _id: purchase._id,
          productId: purchase.productId,
          productName: purchase.productName,
          price: purchase.price,
          purchaseDate: purchase.purchaseDate,
          buyerId: purchase.userId,
          buyerName: user?.name || purchase.userName || "Unknown",  // ✅ เพิ่มชื่อผู้ซื้อ
        };
      })
    );

    return res.status(200).json(purchasesWithUser || []);

  } catch (error) {

    console.error("GET PURCHASE ERROR:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}

  // =====================================================
  // POST = ซื้อสินค้า
  // =====================================================

  if (req.method === "POST") {

    try {

      const {
        userId,
        productId,
        price
      } = req.body;

      if (!userId || !productId) {

        return res.status(400).json({
          error: "Missing userId or productId"
        });

      }

      // =====================================================
      // หา USER
      // =====================================================

      const user = await User.findOne({
        discordId: userId
      });

      if (!user) {

        return res.status(404).json({
          error: "User not found"
        });

      }

      // =====================================================
      // หา PRODUCT
      // =====================================================

      const product = await Item.findById(productId);

      if (!product) {

        return res.status(404).json({
          error: "Product not found"
        });

      }

      // =====================================================
      // เช็ค POINT
      // =====================================================

      if ((user.points || 0) < Number(price)) {

        return res.status(400).json({
          error: "Point ไม่เพียงพอ"
        });

      }

      // =====================================================
      // หัก POINT
      // =====================================================

      user.points -= Number(price);

      // =====================================================
      // เพิ่มสินค้าใน USER
      // =====================================================

      if (!user.products) {
        user.products = [];
      }

      user.products.push({
        productId: product._id,
        name: product.itemsname,
        version: product.itemsversion,
        fileUrl: product.itemsfile,
        image: product.itemsimage || "",
        itemsimages: product.itemsimages || [],
        discordRoleIds: product.discordRoleIds || [],
        purchasedAt: new Date(),
      });

      user.markModified("products");

      await user.save();

      // =====================================================
      // บันทึก PURCHASE HISTORY
      // =====================================================

      await Purchase.create({
        userId: user.discordId,
        userName: user.name,

        productId: product._id,
        productName: product.itemsname,

        price: Number(price),

        purchaseDate: new Date()
      });

      // =====================================================
      // เพิ่ม DISCORD ROLE
      // =====================================================
      
      
      if (
        product.discordRoleIds &&
        product.discordRoleIds.length > 0
      ) {

        console.log(
          `📌 กำลังเพิ่ม Role ${product.discordRoleIds.join(", ")} ให้ ${user.discordId}...`
        );

        await addDiscordRoles(
          user.discordId,
          product.discordRoleIds
        );

      }

      return res.status(200).json({
        success: true,
        message: "Purchase successful",
        remainingPoints: user.points  // ✅ ต้องมีบรรทัดนี้!
      });

    } catch (error) {

      console.error("PURCHASE ERROR:", error);

      return res.status(500).json({
        error: error.message
      });

    }

  }

  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  return res.status(405).json({
    error: "Method not allowed"
  });

}