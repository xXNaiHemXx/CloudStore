import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = [];
    let needSave = false;

    for (let i = 0; i < user.products.length; i++) {
      const userProduct = user.products[i];

      // ดึงสินค้าล่าสุด
      const latestProduct = await Item.findById(userProduct.productId);
      if (!latestProduct) continue;

      const currentVer = userProduct.currentVersion || userProduct.version;
      const latestVer = latestProduct.itemsversion;

      //  ตรวจสอบว่ามีเวอร์ชันใหม่
      if (latestVer !== currentVer) {
        updates.push({
          productId: userProduct.productId,
          name: userProduct.name,
          oldVersion: currentVer,
          newVersion: latestVer,
          downloadUrl: latestProduct.itemsfile,
          fileSize: latestProduct.fileSize || "Unknown",
        });

        //  อัปเดต hasUpdate
        if (!userProduct.hasUpdate) {
          user.products[i].hasUpdate = true;
          user.products[i].currentVersion = currentVer;
          needSave = true;
        }
      } else {
        //  ปิด hasUpdate ถ้าเวอร์ชันตรงกันแล้ว
        if (userProduct.hasUpdate) {
          user.products[i].hasUpdate = false;
          needSave = true;
        }
      }
    }

    //  ใช้ findOneAndUpdate แทน save() เพื่อป้องกัน VersionError
    if (needSave) {
      try {
        await User.findOneAndUpdate(
          { discordId: userId },
          { $set: { products: user.products } },
          { new: true, runValidators: false }
        );
      } catch (saveErr) {
        //  ถ้า error → log แต่ไม่ throw (ให้ response กลับไปก่อน)
        console.error("Save products error (non-critical):", saveErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      updates: updates,
      hasUpdates: updates.length > 0,
      updateCount: updates.length,
    });

  } catch (error) {
    console.error("Check updates error:", error);

    //  ถ้าเป็น VersionError → ส่ง response ปกติ (ไม่ error)
    if (error.name === 'VersionError') {
      return res.status(200).json({
        success: true,
        updates: [],
        hasUpdates: false,
        updateCount: 0,
        message: 'Document version conflict, skipping save',
      });
    }

    return res.status(500).json({ error: error.message });
  }
}