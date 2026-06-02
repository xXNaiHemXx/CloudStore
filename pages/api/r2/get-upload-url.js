// pages/api/r2/get-upload-url.js
import { getPresignedUploadUrl } from "@/utils/r2";
import { requireAdmin } from "@/utils/checkAdmin";

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

  // ✅ ตรวจสอบสิทธิ์ Admin จาก Database
  const auth = await requireAdmin(req, res);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
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