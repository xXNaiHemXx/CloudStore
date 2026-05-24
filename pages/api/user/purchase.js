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

      const user = await User.findOne({
        discordId: userId
      });

      if (!user) {

        return res.status(404).json({
          error: "User not found"
        });

      }

      const product = await Item.findById(productId);

      if (!product) {

        return res.status(404).json({
          error: "Product not found"
        });

      }

      // =====================================================
      // เช็ค point
      // =====================================================

      if ((user.points || 0) < price) {

        return res.status(400).json({
          error: "Point ไม่เพียงพอ"
        });

      }

      // =====================================================
      // หัก point
      // =====================================================

      user.points -= Number(price);

      // =====================================================
      // เพิ่มสินค้าให้ user
      // =====================================================

      if (!user.products) {
        user.products = [];
      }

      user.products.push({
        productId: product._id,
        purchaseDate: new Date()
      });

      user.markModified("products");

      await user.save();

      // =====================================================
      // บันทึก purchase history
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
      // Discord Roles
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
        success: true
      });

    } catch (error) {

      console.error(error);

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