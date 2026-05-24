import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
// ❌ ลบ import Item เพราะไม่จำเป็นต้องใช้ใน remove-product
import { removeDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    const { userId, productId, index } = req.body;

    console.log("=========================================");
    console.log("📌 ลบสินค้า request:", { userId, productId, index });

    if (!userId || !productId) {
      return res.status(400).json({ error: "ขาด userId หรือ productId" });
    }

    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    console.log("📌 ผู้ใช้:", user.name, "Discord ID:", user.discordId);

    const products = user.products || [];
    
    // หาสินค้าที่ต้องการลบ
    const matchedIndexes = products.reduce((acc, p, i) => {
      if (String(p.productId) === String(productId)) {
        acc.push(i);
      }
      return acc;
    }, []);

    console.log("📌 matchedIndexes:", matchedIndexes);

    if (matchedIndexes.length === 0) {
      return res.status(404).json({ error: "ไม่พบสินค้าในรายการของผู้ใช้" });
    }

    let indexToRemove;
    if (index !== undefined && matchedIndexes.includes(index)) {
      indexToRemove = index;
    } else {
      indexToRemove = matchedIndexes[matchedIndexes.length - 1];
    }

    const removedProduct = products[indexToRemove];
    console.log("📌 สินค้าที่จะลบ:", {
      name: removedProduct.name,
      discordRoleIds: removedProduct.discordRoleIds
    });
    
    // ✅ ลบ Role ของ USER คนนี้ทันที
    if (removedProduct.discordRoleIds && removedProduct.discordRoleIds.length > 0) {
      console.log(`📌 กำลังลบ Role ${removedProduct.discordRoleIds.join(", ")} ของผู้ใช้ ${userId}...`);
      
      const result = await removeDiscordRoles(userId, removedProduct.discordRoleIds);
      
      if (result.removed && result.removed.length > 0) {
        console.log(`✅ ลบ Role สำเร็จ: ${result.removed.join(", ")}`);
      }
      if (result.failed && result.failed.length > 0) {
        console.log(`❌ ลบ Role ไม่สำเร็จ: ${result.failed.join(", ")}`);
      }
    } else {
      console.log("⚠️ สินค้านี้ไม่มี Discord Role IDs ให้ลบ");
    }
    
    // ลบสินค้าออกจาก array
    user.products = products.filter((_, i) => i !== indexToRemove);
    user.markModified("products");
    await user.save();

    console.log(`✅ ลบสินค้า ${removedProduct.name} ของผู้ใช้ ${user.name} สำเร็จ!`);
    console.log("=========================================");

    return res.status(200).json({
      success: true,
      message: "ลบสินค้าสำเร็จ",
      products: user.products
    });

  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    return res.status(500).json({ error: error.message });
  }
}