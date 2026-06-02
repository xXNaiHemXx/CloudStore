// pages/api/admin/check-admin.js
import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  const { discordId } = req.query;
  
  if (!discordId) {
    return res.status(400).json({ error: "Missing discordId" });
  }

  try {
    await connectToDB();
    
    // เช็คจาก .env Head Admin
    const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
    if (envAdminIds.includes(discordId)) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: "head",
        source: "env"
      });
    }
    
    // เช็คจาก Database
    const admin = await Admin.findOne({ discordId, isActive: true });
    
    if (admin) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: admin.role,
        source: "database"
      });
    }
    
    return res.status(200).json({ isAdmin: false });
    
  } catch (error) {
    console.error("Check admin error:", error);
    return res.status(500).json({ error: error.message });
  }
}