import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";
import ProductVersion from "@/models/ProductVersion";

export default async function handler(req, res) {

  // ต้องเป็น METHOD POST เท่านั้น
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    await connectToDB();

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // ค้นหาผู้ใช้
    const user = await User.findOne({ discordId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = [];

    // ตรวจสอบสินค้าทุกตัวที่ผู้ใช้มี
    for (let i = 0; i < user.products.length; i++) {
      const userProduct = user.products[i];

      // ดึงข้อมูลสินค้าล่าสุด
      const latestProduct = await Item.findById(userProduct.productId);

      if (!latestProduct) continue;

      // ดึงเวอร์ชันล่าสุดจาก ProductVersion
      const latestVersion = await ProductVersion.findOne({
        productId: userProduct.productId
      }).sort({ createdAt: -1 });

      // ตรวจสอบว่ามีเวอร์ชันใหม่หรือไม่
      const currentVersion = userProduct.currentVersion || userProduct.version;
      const hasNewVersion = latestVersion && latestVersion.version !== currentVersion;

      if (hasNewVersion) {
        updates.push({
          productId: userProduct.productId,
          name: userProduct.name,
          oldVersion: currentVersion,
          newVersion: latestVersion.version,
          fileUrl: latestVersion.downloadUrl,
          changelog: latestVersion.changelog,
          releaseDate: latestVersion.createdAt,
          isImportant: latestVersion.isImportant,
          isForceUpdate: latestVersion.isForceUpdate,
          fileSize: latestVersion.fileSize
        });

        // อัปเดต hasUpdate ใน user (ถ้ายังไม่ได้อัปเดต)
        if (!userProduct.hasUpdate) {
          user.products[i].hasUpdate = true;
          user.products[i].currentVersion = latestVersion.version;
        }
      }
    }

    // ถ้ามีการอัปเดต ให้ save user
    if (updates.length > 0) {
      user.markModified("products");
      await user.save();
    }

    return res.status(200).json({
      success: true,
      updates: updates,
      hasUpdates: updates.length > 0,
      updateCount: updates.length
    });

  } catch (error) {

    console.error("Check updates error:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}