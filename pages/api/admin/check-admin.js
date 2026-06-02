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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ ตรวจสอบ Session
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }

  // ✅ ตรวจสอบว่าเป็น Admin หรือไม่
  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  const isAdmin = adminIds.includes(session.user.id);
  
  // ✅ ถ้าไม่ใช่ Admin ให้ check จาก database ด้วย
  let isDbAdmin = false;
  if (!isAdmin) {
    try {
      const adminCheck = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/check-admin?discordId=${session.user.id}`);
      const adminData = await adminCheck.json();
      isDbAdmin = adminData.isAdmin || false;
    } catch (err) {
      console.error("Admin check error:", err);
    }
  }
  
  if (!isAdmin && !isDbAdmin) {
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