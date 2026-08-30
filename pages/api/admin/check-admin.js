// pages/api/admin/check-admin.js
import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  const { discordId } = req.query;
  
  // ============ DEBUG LOG (แสดงใน CMD) ============
  console.log("========================================");
  console.log("🔍 CHECK ADMIN API CALLED");
  console.log("📌 Time:", new Date().toLocaleString("th-TH"));
  console.log("📌 Discord ID:", discordId);
  console.log("📌 Env Admin IDs:", process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS);
  console.log("📌 MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Not Set");
  console.log("========================================");
  // ============================================
  
  if (!discordId) {
    console.log("❌ Missing discordId");
    return res.status(400).json({ error: "Missing discordId" });
  }

  try {
    console.log("🔄 Connecting to database...");
    await connectToDB();
    console.log("✅ Database connected successfully");
    
    // เช็คจาก .env Head Admin
    const envAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);
    
    console.log("📌 Parsed Env IDs:", envAdminIds);
    console.log("📌 Discord ID (trimmed):", discordId.trim());
    console.log("📌 Is in Env?", envAdminIds.includes(discordId.trim()));
    
    if (envAdminIds.includes(discordId.trim())) {
      console.log("✅ Admin found in ENV (Head Admin)");
      return res.status(200).json({ 
        isAdmin: true, 
        role: "head",
        source: "env"
      });
    }
    
    // เช็คจาก Database
    console.log("🔍 Searching in database...");
    const admin = await Admin.findOne({ 
      discordId: discordId.trim(), 
      isActive: true 
    });
    
    if (admin) {
      console.log("✅ Admin found in DATABASE:", admin.name, "-", admin.role);
      return res.status(200).json({ 
        isAdmin: true, 
        role: admin.role,
        source: "database"
      });
    }
    
    console.log("❌ Admin NOT FOUND in both Env and Database");
    return res.status(200).json({ isAdmin: false });
    
  } catch (error) {
    console.error("❌ Check admin error:", error.message);
    console.error("❌ Full error:", error);
    return res.status(500).json({ error: error.message });
  }
}