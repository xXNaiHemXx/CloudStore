// pages/api/admin/check-admin.js
import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  // ตรวจสอบ Method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { discordId } = req.query;
  
  if (!discordId) {
    return res.status(400).json({ error: "Missing discordId" });
  }

  // Trim ค่า discordId เพื่อป้องกันช่องว่าง
  const cleanDiscordId = String(discordId).trim();

  try {
    await connectToDB();
    
    // 1. เช็คจาก .env Head Admin (สิทธิ์สูงสุด)
    const envAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "")
      .split(",")
      .map(id => id.trim())  // Trim แต่ละ ID
      .filter(Boolean);      // กรองค่าว่างออก
    
    console.log("📌 Checking Discord ID:", cleanDiscordId);
    console.log("📌 Env Admin IDs:", envAdminIds);
    
    if (envAdminIds.includes(cleanDiscordId)) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: "head",
        source: "env"
      });
    }
    
    // 2. เช็คจาก Database
    const admin = await Admin.findOne({ 
      discordId: cleanDiscordId, 
      isActive: true 
    });
    
    if (admin) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: admin.role || "admin",
        source: "database",
        adminId: admin._id,
        name: admin.name
      });
    }
    
    // 3. ไม่พบสิทธิ์
    return res.status(200).json({ 
      isAdmin: false,
      message: "No admin privileges found"
    });
    
  } catch (error) {
    console.error("❌ Check admin error:", error);
    
    // Fallback: ถ้า DB error แต่ตรงกับ env ก็ให้ผ่าน
    const envAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);
    
    if (envAdminIds.includes(cleanDiscordId)) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: "head",
        source: "env_fallback",
        message: "Head Admin from environment (DB error)"
      });
    }
    
    return res.status(500).json({ 
      error: error.message,
      isAdmin: false 
    });
  }
}