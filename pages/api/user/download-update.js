import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";
import ProductVersion from "@/models/ProductVersion";
import UserDownload from "@/models/UserDownload";

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

    // ค้นหาสินค้า
    const product = await Item.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ดึงเวอร์ชันล่าสุด
    const latestVersion = await ProductVersion.findOne({
      productId: productId
    }).sort({ createdAt: -1 });

    if (!latestVersion) {
      return res.status(404).json({ error: "Version not found" });
    }

    // อัปเดตข้อมูลใน user
    const productIndex = user.products.findIndex(p => p.productId === productId);

    if (productIndex !== -1) {
      user.products[productIndex].fileUrl = latestVersion.downloadUrl;
      user.products[productIndex].version = latestVersion.version;
      user.products[productIndex].currentVersion = latestVersion.version;
      user.products[productIndex].hasUpdate = false;
      user.products[productIndex].lastUpdateCheck = new Date();
      
      user.markModified("products");
      await user.save();
    }

    // บันทึกประวัติการดาวน์โหลด
    await UserDownload.create({
      userId: userId,
      productId: productId,
      version: latestVersion.version,
      downloadedAt: new Date(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
    });

    // อัปเดตสถิติการดาวน์โหลดของเวอร์ชัน
    latestVersion.downloadCount = (latestVersion.downloadCount || 0) + 1;
    await latestVersion.save();

    // อัปเดตสถิติรวมของสินค้า
    product.totalDownloads = (product.totalDownloads || 0) + 1;
    await product.save();

    return res.status(200).json({
      success: true,
      downloadUrl: latestVersion.downloadUrl,
      version: latestVersion.version,
      changelog: latestVersion.changelog,
      fileSize: latestVersion.fileSize
    });

  } catch (error) {

    console.error("Download update error:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}