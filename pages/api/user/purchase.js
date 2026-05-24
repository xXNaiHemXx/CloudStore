import { connectToDB } from "@/utils/db";
import Purchase from "@/models/Purchase";
import Item from "@/models/items";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { addDiscordRoles } from "@/utils/discord";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    }

    await connectToDB();
    const { userId, productId, price } = req.body;

    if (!userId || !productId || !price) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    const sessionUserId = session.user.discordId || session.user.id;
    if (sessionUserId !== userId) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์ทำรายการ" });
    }

    try {
      let user = await User.findOne({ discordId: userId });
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
      }

      const currentPoints = Number(user.points) || 0;
      const productPrice = Number(price);
      
      if (currentPoints < productPrice) {
        return res.status(400).json({ error: `Point ไม่เพียงพอ (มี ${currentPoints} ต้องการ ${productPrice})` });
      }

      const product = await Item.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "ไม่พบข้อมูลสินค้า" });
      }

      console.log("📌 สินค้าที่ซื้อ:", {
        name: product.itemsname,
        discordRoleIds: product.discordRoleIds
      });

      // หักแต้ม
      user.points = currentPoints - productPrice;

      // เพิ่มสินค้าให้ผู้ใช้ (✅ ต้องมี discordRoleIds)
      if (!Array.isArray(user.products)) user.products = [];
      
      user.products.push({
        productId: product._id.toString(),
        name: product.itemsname,
        image: product.itemsimage,
        version: product.itemsversion,
        fileUrl: product.itemsfile,
        purchaseDate: new Date(),
        discordRoleIds: product.discordRoleIds || [], // ✅ สำคัญ!
      });

      await user.save();

      // ✅ เพิ่ม Role ใน Discord
      if (product.discordRoleIds && product.discordRoleIds.length > 0) {
        console.log(`📌 กำลังเพิ่ม Role ${product.discordRoleIds.join(", ")} ให้ ${userId}...`);
        await addDiscordRoles(userId, product.discordRoleIds);
      }

      await Purchase.create({
        userId: user.discordId || user._id.toString(),
        userName: user.name,
        productId: product._id.toString(),
        productName: product.itemsname,
        price: productPrice,
        purchaseDate: new Date(),
      });

      return res.status(200).json({ 
        message: "ซื้อสินค้าสำเร็จ!", 
        remainingPoints: user.points 
      });
      
    } catch (error) {
      console.error("Purchase error:", error);
      return res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการซื้อสินค้า" });
    }
  } catch (error) {
    console.error("Purchase API error:", error);
    return res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}