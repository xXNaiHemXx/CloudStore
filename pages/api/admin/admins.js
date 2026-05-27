import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  await connectToDB();

  // ✅ ฟังก์ชันเช็คว่าเป็น Head หรือไม่
  const isHeadAdmin = async (discordId) => {
    // เช็คจาก Database ก่อน
    const admin = await Admin.findOne({ discordId, role: "head", isActive: true });
    if (admin) return true;
    
    // Fallback: เช็คจาก .env
    const envHeadIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
    return envHeadIds.includes(discordId);
  };

  // GET - ดึงรายชื่อ Admin ทั้งหมด
  if (req.method === "GET") {
    try {
      const admins = await Admin.find().sort({ createdAt: -1 });
      return res.status(200).json({ admins });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - เพิ่ม Admin ใหม่ (เฉพาะ Head)
  if (req.method === "POST") {
    try {
      const { discordId, name, role, addedBy, headId } = req.body;

      // ✅ เช็คว่าเป็น Head หรือไม่
      const isHead = await isHeadAdmin(headId);
      if (!isHead) {
        return res.status(403).json({ error: "เฉพาะ Head Admin เท่านั้นที่เพิ่ม Admin ได้" });
      }

      const existing = await Admin.findOne({ discordId });
      if (existing) {
        return res.status(400).json({ error: "Discord ID นี้เป็น Admin อยู่แล้ว" });
      }

      const admin = await Admin.create({
        discordId,
        name,
        role: role || "admin",
        addedBy: addedBy || headId,
      });

      return res.status(201).json({ success: true, admin });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - แก้ไข Admin
  if (req.method === "PUT") {
    try {
      const { id, role, isActive, headId } = req.body;

      const isHead = await isHeadAdmin(headId);
      if (!isHead) {
        return res.status(403).json({ error: "เฉพาะ Head Admin เท่านั้นที่แก้ไขได้" });
      }

      const admin = await Admin.findByIdAndUpdate(id, { role, isActive }, { new: true });
      return res.status(200).json({ success: true, admin });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - ลบ Admin
  if (req.method === "DELETE") {
    try {
      const { id, headId } = req.query;

      const isHead = await isHeadAdmin(headId);
      if (!isHead) {
        return res.status(403).json({ error: "เฉพาะ Head Admin เท่านั้นที่ลบได้" });
      }

      await Admin.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}