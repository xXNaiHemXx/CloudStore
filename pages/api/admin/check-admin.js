// pages/api/admin/check-admin.js
// เช็คสิทธิ์ของ "คนที่ล็อกอินอยู่" เท่านั้น — ไม่รับ discordId จาก query อีกต่อไป
// (เดิมใครก็ยิง ?discordId=xxx เพื่อไล่หาว่าใครเป็นแอดมินได้ และ log ก็พ่น env ออกมา)
import { getSessionUserId, getAdminRole } from "@/utils/checkAdmin";
import { allowMethods, rateLimit } from "@/utils/apiGuard";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  if (!rateLimit(req, res, { key: "check-admin", limit: 30 })) return;

  res.setHeader("Cache-Control", "no-store");

  const { userId } = await getSessionUserId(req, res);
  if (!userId) return res.status(200).json({ isAdmin: false });

  const role = await getAdminRole(userId);
  return res.status(200).json({ isAdmin: !!role, role: role || null });
}
