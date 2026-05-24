import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    await connectToDB();

    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    // ค้นหาผู้ใช้
    const user = await User.findOne({ discordId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ค้นหาสินค้าล่าสุด
    const latestProduct = await Item.findById(productId);

    if (!latestProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ✅ อัปเดตข้อมูลใน user.products
    let updated = false;
    
    user.products = user.products.map(p => {
      if (p.productId === productId) {
        updated = true;
        return {
          ...p.toObject(),
          version: latestProduct.itemsversion,
          currentVersion: latestProduct.itemsversion,
          fileUrl: latestProduct.itemsfile,
          hasUpdate: false  // ✅ สำคัญ: ปิดการแจ้งเตือน
        };
      }
      return p;
    });

    if (!updated) {
      return res.status(404).json({ error: "Product not found in user inventory" });
    }

    user.markModified("products");
    await user.save();

    console.log(`✅ อัปเดตสินค้า ${latestProduct.itemsname} ของ ${user.name} เป็นเวอร์ชัน ${latestProduct.itemsversion}`);

    return res.status(200).json({
      success: true,
      downloadUrl: latestProduct.itemsfile,
      version: latestProduct.itemsversion,
      productName: latestProduct.itemsname
    });

  } catch (error) {

    console.error("Download update error:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}