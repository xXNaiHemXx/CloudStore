// utils/checkAdmin.js
//
// ศูนย์กลางการตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์ทั้งหมด
// กฎเหล็ก: ตัวตนของผู้ใช้ต้องมาจาก session (cookie ที่ NextAuth เซ็นไว้) เท่านั้น
// ห้ามเชื่อ userId / discordId / headId ที่ client ส่งมาใน body หรือ query เด็ดขาด
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

async function connectDB() {
  const { connectToDB } = await import("@/utils/db");
  return connectToDB();
}

// รายชื่อ Head Admin อ่านจาก env ฝั่งเซิร์ฟเวอร์ (ADMIN_DISCORD_IDS)
// NEXT_PUBLIC_* ถูกฝังลง bundle ฝั่ง browser ทำให้ทุกคนเห็น จึงใช้เป็น fallback ชั่วคราวเท่านั้น
export function getHeadAdminIds() {
  const raw = process.env.ADMIN_DISCORD_IDS || process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "";
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

export async function getAdminRole(discordId) {
  if (!discordId || typeof discordId !== "string") return null;

  if (getHeadAdminIds().includes(discordId)) return "head";

  try {
    await connectDB();
    const Admin = (await import("@/models/Admin")).default;
    const admin = await Admin.findOne({ discordId: String(discordId), isActive: true });
    return admin?.role || null;
  } catch (error) {
    console.error("Get admin role error:", error.message);
    return null;
  }
}

export async function checkAdminStatus(discordId) {
  return !!(await getAdminRole(discordId));
}

export async function getSessionUserId(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const id = session?.user?.id;
  return id ? { session, userId: String(id) } : { session: null, userId: null };
}

// ใช้ใน API route: const user = await requireUser(req, res); if (!user) return;
export async function requireUser(req, res) {
  const { session, userId } = await getSessionUserId(req, res);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized - Please login" });
    return null;
  }
  return { session, userId };
}

// คงรูปแบบเดิมไว้ (คืน object ที่มี isAdmin/error/status) เพื่อให้ไฟล์เก่าเรียกใช้ได้เหมือนเดิม
export async function requireAdmin(req, res) {
  const { session, userId } = await getSessionUserId(req, res);
  if (!userId) {
    return { error: "Unauthorized - Please login", status: 401 };
  }

  const role = await getAdminRole(userId);
  if (!role) {
    console.warn(`🚫 [ADMIN DENIED] ${userId} → ${req.method} ${req.url}`);
    return { error: "Forbidden - Admin only", status: 403 };
  }

  return { isAdmin: true, session, userId, role };
}

export async function requireHeadAdmin(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth.isAdmin) return auth;
  if (auth.role !== "head") {
    return { error: "เฉพาะ Head Admin เท่านั้น", status: 403 };
  }
  return auth;
}
