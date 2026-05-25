import { getPresignedUploadUrl } from "@/utils/r2";
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