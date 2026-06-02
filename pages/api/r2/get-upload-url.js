// pages/api/r2/get-upload-url.js
import { getPresignedUploadUrl } from "@/utils/r2";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// ✅ ฟังก์ชันตรวจสอบ Admin จาก Database โดยตรง (ไม่ต้องเรียก API ซ้ำ)
async function checkDbAdmin(discordId) {
  try {
    const { connectToDB } = await import("@/utils/db");
    const Admin = (await import("@/models/Admin")).default;
    
    await connectToDB();
    const admin = await Admin.findOne({ discordId, isActive: true });
    return !!admin;
  } catch (err) {
    console.error("DB Admin check error:", err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ ตรวจสอบ Session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }

  // ✅ ตรวจสอบว่าเป็น Admin หรือไม่ (จาก .env ก่อน)
  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  let isAdmin = adminIds.includes(session.user.id);
  
  // ✅ ถ้าไม่ใช่ Head Admin ให้ตรวจสอบจาก Database
  if (!isAdmin) {
    isAdmin = await checkDbAdmin(session.user.id);
  }
  
  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden - Admin only" });
  }

  try {
    const { fileName, contentType } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName" });
    }

    const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl(fileName, contentType);
    
    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      fileKey: key,
    });
    
  } catch (error) {
    console.error("Get upload URL error:", error);
    return res.status(500).json({ error: error.message });
  }
}