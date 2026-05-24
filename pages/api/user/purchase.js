import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Item from "../../../models/items";
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

      return res.status(200).json(
        purchases || []
      );

    } catch (error) {

      console.error(error);

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
          error: "Missing required fields"
        });

      }

      // =====================================================
      // FIND USER
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
      // FIND PRODUCT
      // =====================================================

      const product = await Item.findById(productId);

      if (!product) {

        return res.status(404).json({
          error: "Product not found"
        });

      }

      console.log("📌 PURCHASE DETAIL:", {
        user: user.name,
        product: product.itemsname,
        price: price,
        discordRoleIds: product.discordRoleIds
      });

      // =====================================================
      // CHECK POINTS
      // =====================================================

      if ((user.points || 0) < price) {

        return res.status(400).json({
          error: "Point ไม่เพียงพอ"
        });

      }

      // =====================================================
      // DEDUCT POINTS
      // =====================================================

      user.points -= Number(price);

      // =====================================================
      // ADD PRODUCT TO USER (SNAPSHOT)
      // =====================================================

      if (!user.products) {
        user.products = [];
      }

      user.products.push({
        productId: product._id.toString(),
        name: product.itemsname || "",
        version: product.itemsversion || "",
        image: product.itemsimage || "",
        fileUrl: product.itemsfile || "",
        discordRoleIds: product.discordRoleIds || [],
        purchaseDate: new Date()
      });

      user.markModified("products");
      await user.save();

      // =====================================================
      // SAVE PURCHASE HISTORY
      // =====================================================

      await Purchase.create({
        buyerId: user.discordId,
        buyerName: user.name,
        productId: product._id,
        productName: product.itemsname,
        price: Number(price),
        purchaseDate: new Date()
      });

      // =====================================================
      // ADD DISCORD ROLES
      // =====================================================

      if (product.discordRoleIds && product.discordRoleIds.length > 0) {

        console.log(`📌 กำลังเพิ่ม Role ${product.discordRoleIds.join(", ")} ให้ ${user.discordId}...`);

        const roleResult = await addDiscordRoles(
          user.discordId,
          product.discordRoleIds
        );

        console.log("📌 ADD ROLE RESULT:", roleResult);

      }

      console.log(`✅ Purchase success: ${product.itemsname} for ${user.name}`);

      return res.status(200).json({
        success: true,
        remainingPoints: user.points,
        product: {
          id: product._id,
          name: product.itemsname
        }
      });

    } catch (error) {

      console.error("❌ PURCHASE ERROR:", error);

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