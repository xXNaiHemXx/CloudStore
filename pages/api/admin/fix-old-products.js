// pages/api/admin/fix-old-products.js (เก็บไว้ใช้ครั้งเดียว)
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    
    // ดึงสินค้าทั้งหมดที่มี discordRoleIds
    const itemsWithRoles = await Item.find({ discordRoleIds: { $exists: true, $ne: [] } });
    
    let updatedCount = 0;
    
    for (const item of itemsWithRoles) {
      const users = await User.find({
        "products.productId": item._id.toString(),
        "products.discordRoleIds": { $exists: false } // ✅ หาเฉพาะที่ยังไม่มี discordRoleIds
      });
      
      for (const user of users) {
        let modified = false;
        
        user.products = user.products.map(p => {
          if (p.productId === item._id.toString() && !p.discordRoleIds) {
            modified = true;
            return { ...p, discordRoleIds: item.discordRoleIds || [] };
          }
          return p;
        });
        
        if (modified) {
          user.markModified("products");
          await user.save();
          updatedCount++;
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `อัปเดตสินค้าเก่าเรียบร้อย`,
      updatedUsers: updatedCount
    });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}