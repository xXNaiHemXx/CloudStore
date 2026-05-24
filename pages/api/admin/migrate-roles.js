import { connectToDB } from "@/utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    
    // ✅ อัปเดต users ทุกคน: เพิ่ม discordRoleIds ถ้ายังไม่มี
    const result = await User.updateMany(
      { "products.discordRoleIds": { $exists: false } },
      { $set: { "products.$[].discordRoleIds": [] } }
    );
    
    console.log("✅ อัปเดตสำเร็จ:", result);
    
    return res.status(200).json({ 
      success: true, 
      message: "Migrated all users",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}