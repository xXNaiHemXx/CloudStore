// utils/checkAdmin.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

async function connectDB() {
  const { connectToDB } = await import("@/utils/db");
  return connectToDB();
}

export async function checkAdminStatus(discordId) {
  if (!discordId) return false;
  
  // เช็คจาก .env ก่อน (Head Admin)
  const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  if (envAdminIds.includes(discordId)) {
    return true;
  }
  
  // เช็คจาก Database
  try {
    await connectDB();
    const Admin = (await import("@/models/Admin")).default;
    const admin = await Admin.findOne({ discordId, isActive: true });
    return !!admin;
  } catch (error) {
    console.error("Check admin error:", error);
    return false;
  }
}

export async function getAdminRole(discordId) {
  if (!discordId) return null;
  
  // เช็คจาก .env (Head Admin)
  const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  if (envAdminIds.includes(discordId)) {
    return "head";
  }
  
  // เช็คจาก Database
  try {
    await connectDB();
    const Admin = (await import("@/models/Admin")).default;
    const admin = await Admin.findOne({ discordId, isActive: true });
    return admin?.role || null;
  } catch (error) {
    console.error("Get admin role error:", error);
    return null;
  }
}

export async function requireAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return { error: "Unauthorized - Please login", status: 401 };
  }
  
  const isAdmin = await checkAdminStatus(session.user.id);
  
  if (!isAdmin) {
    return { error: "Forbidden - Admin only", status: 403 };
  }
  
  const role = await getAdminRole(session.user.id);
  
  return { isAdmin: true, session, role };
}