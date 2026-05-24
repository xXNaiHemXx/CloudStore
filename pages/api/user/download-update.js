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

    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    // =====================================================
    // 1. ค้นหาผู้ใช้
    // =====================================================
    const user = await User.findOne({ discordId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // =====================================================
    // 2. ค้นหาสินค้า
    // =====================================================
    const product = await Item.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // =====================================================
    // 3. ดึงเวอร์ชันล่าสุด
    // =====================================================
    const latestVersion = await ProductVersion.findOne({
      productId: productId
    }).sort({ createdAt: -1 });

    // ถ้าไม่มีระบบ ProductVersion ให้ใช้ข้อมูลจาก product
    const downloadUrl = latestVersion?.downloadUrl || product.itemsfile;
    const version = latestVersion?.version || product.itemsversion;
    const changelog = latestVersion?.changelog || [];
    const fileSize = latestVersion?.fileSize || "Unknown";

    // =====================================================
    // 4. อัปเดตข้อมูลใน user (ถ้ามีสินค้านี้)
    // =====================================================
    const productIndex = user.products.findIndex(p => p.productId === productId);

    if (productIndex !== -1) {
      user.products[productIndex].fileUrl = downloadUrl;
      user.products[productIndex].version = version;
      user.products[productIndex].currentVersion = version;
      user.products[productIndex].hasUpdate = false;
      user.products[productIndex].lastUpdateCheck = new Date();
      
      user.markModified("products");
      await user.save();
    }

    // =====================================================
    // 5. ส่ง URL ดาวน์โหลดกลับไป
    // =====================================================
    return res.status(200).json({
      success: true,
      downloadUrl: downloadUrl,
      version: version,
      changelog: changelog,
      fileSize: fileSize
    });

  } catch (error) {

    console.error("Download update error:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}