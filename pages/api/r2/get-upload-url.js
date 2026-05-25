import { getPresignedUploadUrl } from "@/utils/cloudflare";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  if (!adminIds.includes(session.user.id)) {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { fileName, contentType } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName" });
    }

    // ✅ สร้าง key สำหรับเก็บใน R2
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `products/${timestamp}_${safeName}`;
    
    const result = await getPresignedUploadUrl(key, contentType || "application/octet-stream", 3600);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    // ✅ สร้าง public URL สำหรับดาวน์โหลด
    const publicUrl = `${process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev`}/${key}`;
    
    return res.status(200).json({
      success: true,
      uploadUrl: result.url,
      fileKey: key,
      publicUrl: publicUrl,
    });
    
  } catch (error) {
    console.error("Get upload URL error:", error);
    return res.status(500).json({ error: error.message });
  }
}