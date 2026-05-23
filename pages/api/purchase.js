import { connectToDB } from "@/utils/db";
import Purchase from "@/models/Purchase";
import Item from "@/models/items";
import User from "@/models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    const { userId, productId, price } = req.body;

    if (!userId || !productId || !price) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    // --- MongoDB Transaction (Atomic: deduct + save) ---
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ discordId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
      }

      if (user.points < price) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: "Point ไม่เพียงพอ" });
      }

      const product = await Item.findById(productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: "ไม่พบข้อมูลสินค้า" });
      }

      // Deduct points
      user.points -= price;

      // Add product to user
      if (!Array.isArray(user.products)) user.products = [];
      user.products.push({
        productId: product._id.toString(),
        name: product.itemsname,
        image: product.itemsimage,
        version: product.itemsversion,
        fileUrl: product.itemsfile,
        purchaseDate: new Date(),
      });

      user.markModified("products");
      await user.save({ session });

      // Save purchase record
      await Purchase.create(
        [
          {
            userId: user.discordId,
            userName: user.name,
            productId: product._id.toString(),
            productName: product.itemsname,
            price,
            purchaseDate: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: "ซื้อสินค้าสำเร็จ!", user });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Purchase API error:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}
