import { connectToDB } from "@/utils/db";
import Item from "@/models/items";
import User from "@/models/User";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    const { productId, newVersion, newFileUrl, changelog } = req.body;

    if (!productId || !newVersion || !newFileUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const oldVersion = product.itemsversion;
    const oldFileUrl = product.itemsfile;
    
    //  อัปเดตทุกฟิลด์
    product.itemsversion = newVersion;
    product.itemsfile = newFileUrl;
    product.currentVersion = newVersion;  // ← เพิ่มบรรทัดนี้
    product.latestUpdate = new Date();
    product.updatedAt = new Date();
    
    if (!product.versionHistory) product.versionHistory = [];
    product.versionHistory.push({
      version: oldVersion,
      fileUrl: oldFileUrl,
      changelog: changelog || "",
      releaseDate: new Date()
    });
    
    await product.save();

    const users = await User.find({
      "products.productId": productId
    });

    console.log(`📦 อัปเดตเวอร์ชัน ${product.itemsname}: ${oldVersion} → ${newVersion}`);
    console.log(`👥 พบผู้ใช้ที่มีสินค้านี้: ${users.length} คน`);

    let updatedCount = 0;

    for (const user of users) {
      let modified = false;
      
      user.products = user.products.map(p => {
        if (p.productId === productId) {
          modified = true;
          return {
            ...p.toObject(),
            hasUpdate: true,
            currentVersion: p.version || oldVersion
          };
        }
        return p;
      });

      if (modified) {
        user.markModified("products");
        await user.save();
        updatedCount++;
      }
    }

    console.log(`✅ แจ้งเตือนผู้ใช้ ${updatedCount} คนเรียบร้อย`);

    return res.status(200).json({
      success: true,
      message: "Version updated successfully",
      oldVersion,
      newVersion,
      notifiedUsers: updatedCount,
      totalUsers: users.length
    });

  } catch (error) {
    console.error("Update version error:", error);
    return res.status(500).json({ error: error.message });
  }

}