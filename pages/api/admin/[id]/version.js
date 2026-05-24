import { connectToDB } from "@/utils/db";
import Item from "@/models/items";
import ProductVersion from "@/models/ProductVersion";
import User from "@/models/User";
import { sendDiscordNotification } from "@/utils/discord-webhook";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectToDB();

  const { id } = req.query;
  const {
    version,
    title,
    changelog,
    downloadUrl,
    fileSize,
    fileHash,
    releaseType,
    isImportant,
    isForceUpdate,
    screenshots
  } = req.body;

  if (!id || !version || !title || !downloadUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {

    // ดึงสินค้า
    const product = await Item.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // บันทึกเวอร์ชันเก่าลง history
    const oldVersion = await ProductVersion.findOne({
      productId: id,
      version: product.currentVersion
    });

    if (oldVersion) {
      oldVersion.status = "deprecated";
      await oldVersion.save();
    }

    // สร้างเวอร์ชันใหม่
    const newVersion = await ProductVersion.create({
      productId: id,
      version,
      title,
      changelog: Array.isArray(changelog) ? changelog : changelog.split("\n").filter(l => l.trim()),
      downloadUrl,
      fileSize,
      fileHash,
      releaseType: releaseType || "minor",
      isImportant: isImportant || false,
      isForceUpdate: isForceUpdate || false,
      screenshots: screenshots || [],
      publishedBy: req.headers["x-user-id"] || "admin",
      createdAt: new Date()
    });

    // อัปเดตสินค้า
    const oldVersionNumber = product.currentVersion;
    product.currentVersion = version;
    product.latestUpdate = new Date();
    product.itemsversion = version;
    product.itemsfile = downloadUrl;
    product.totalUpdates += 1;
    await product.save();

    // หาผู้ใช้ที่มีสินค้านี้
    const users = await User.find({
      "products.productId": id
    });

    // อัปเดต hasUpdate สำหรับผู้ใช้
    for (const user of users) {
      let modified = false;
      
      user.products = user.products.map(p => {
        if (p.productId === id) {
          modified = true;
          return {
            ...p,
            hasUpdate: true,
            currentVersion: version,
            forceUpdateRequired: isForceUpdate || false
          };
        }
        return p;
      });

      if (modified) {
        user.markModified("products");
        await user.save();
      }
    }

    // ✅ ส่ง Discord Notification
    await sendDiscordNotification({
      productName: product.itemsname,
      oldVersion: oldVersionNumber,
      newVersion: version,
      title,
      changelog: changelog,
      downloadUrl,
      isImportant,
      isForceUpdate,
      userCount: users.length
    });

    return res.status(201).json({
      success: true,
      message: "Version published successfully",
      version: newVersion,
      notifiedUsers: users.length
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });

  }

}