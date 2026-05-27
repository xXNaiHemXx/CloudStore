import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectToDB();

  const { discordId } = req.query;

  if (!discordId) {
    return res.status(400).json({ error: "Missing discordId" });
  }

  try {
    // ✅ เช็คจาก Database ก่อน
    const admin = await Admin.findOne({ discordId, isActive: true });

    if (admin) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: admin.role,
        name: admin.name,
      });
    }

    // ✅ Fallback: เช็คจาก .env
    const envHeadIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
    if (envHeadIds.includes(discordId)) {
      return res.status(200).json({ 
        isAdmin: true, 
        role: "head",
        name: "Head Admin",
      });
    }

    return res.status(200).json({ isAdmin: false, role: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}