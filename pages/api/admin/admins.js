import { connectToDB } from "@/utils/db";
import Admin from "@/models/Admin";
import { requireAdmin, getHeadAdminIds } from "@/utils/checkAdmin";
import { sameOrigin, isObjectId, isDiscordId, serverError } from "@/utils/apiGuard";

const ROLES = ["admin", "moderator"]; // head ตั้งได้จาก env เท่านั้น ไม่ให้ตั้งผ่าน API

export default async function handler(req, res) {
  if (!sameOrigin(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth.isAdmin) {
    return res.status(auth.status).json({ error: auth.error });
  }

  await connectToDB();

  // ✅ สิทธิ์ Head มาจาก session ของคนที่ล็อกอินเท่านั้น
  // (เดิมเชื่อ headId จาก body ทำให้แอดมินธรรมดาส่ง ID ของ head แล้วเพิ่มแอดมินเองได้)
  const isHead = auth.role === "head";

  if (req.method === "GET") {
    try {
      const admins = await Admin.find().sort({ createdAt: -1 });
      return res.status(200).json({ admins });
    } catch (error) {
      return serverError(res, error, "admins:GET");
    }
  }

  if (!isHead) {
    return res.status(403).json({ error: "เฉพาะ Head Admin เท่านั้นที่จัดการ Admin ได้" });
  }

  if (req.method === "POST") {
    try {
      const { discordId, name, role } = req.body || {};

      if (!isDiscordId(discordId)) {
        return res.status(400).json({ error: "Discord ID ไม่ถูกต้อง" });
      }

      const existing = await Admin.findOne({ discordId });
      if (existing) {
        return res.status(400).json({ error: "Discord ID นี้เป็น Admin อยู่แล้ว" });
      }

      const admin = await Admin.create({
        discordId,
        name: String(name || "Unknown").slice(0, 64),
        role: ROLES.includes(role) ? role : "admin",
        addedBy: auth.session.user.name || auth.userId,
      });

      console.warn(`🛡️ [ADMIN ADDED] ${discordId} (${admin.role}) by ${auth.userId}`);
      return res.status(201).json({ success: true, admin });
    } catch (error) {
      return serverError(res, error, "admins:POST");
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, role, isActive } = req.body || {};
      if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });

      const target = await Admin.findById(id);
      if (!target) return res.status(404).json({ error: "ไม่พบ Admin" });
      if (getHeadAdminIds().includes(target.discordId)) {
        return res.status(400).json({ error: "แก้ไข Head Admin จาก env ไม่ได้" });
      }

      const update = {};
      if (ROLES.includes(role)) update.role = role;
      if (typeof isActive === "boolean") update.isActive = isActive;

      const admin = await Admin.findByIdAndUpdate(id, update, { new: true });
      console.warn(`🛡️ [ADMIN UPDATED] ${target.discordId} ${JSON.stringify(update)} by ${auth.userId}`);
      return res.status(200).json({ success: true, admin });
    } catch (error) {
      return serverError(res, error, "admins:PUT");
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });

      const target = await Admin.findById(id);
      if (!target) return res.status(404).json({ error: "ไม่พบ Admin" });
      if (getHeadAdminIds().includes(target.discordId) || target.discordId === auth.userId) {
        return res.status(400).json({ error: "ลบ Head Admin หรือตัวเองไม่ได้" });
      }

      await Admin.findByIdAndDelete(id);
      console.warn(`🛡️ [ADMIN REMOVED] ${target.discordId} by ${auth.userId}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      return serverError(res, error, "admins:DELETE");
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
