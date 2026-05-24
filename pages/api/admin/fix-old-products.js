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
    const itemsWithRoles = await Item.find({ 
      discordRoleIds: { $exists: true, $ne: [] } 
    });
    
    console.log(`📌 สินค้าที่มี Role: ${itemsWithRoles.length} รายการ`);
    
    let updatedCount = 0;
    
    for (const item of itemsWithRoles) {
      // หาผู้ใช้ที่มีสินค้านี้
      const users = await User.find({
        "products.productId": item._id.toString()
      });
      
      console.log(`📌 สินค้า "${item.itemsname}" มีผู้ใช้ ${users.length} คน`);
      
      for (const user of users) {
        let modified = false;
        
        user.products = user.products.map(p => {
          if (p.productId.toString() === item._id.toString() && (!p.discordRoleIds || p.discordRoleIds.length === 0)) {
            modified = true;
            return { 
              ...p.toObject(), 
              discordRoleIds: item.discordRoleIds 
            };
          }
          return p;
        });
        
        if (modified) {
          user.markModified("products");
          await user.save();
          updatedCount++;
          console.log(`✅ อัปเดตผู้ใช้ ${user.name} เพิ่ม discordRoleIds ให้สินค้า ${item.itemsname}`);
        }
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `อัปเดตผู้ใช้ ${updatedCount} รายการเรียบร้อย`,
      updatedCount 
    });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}