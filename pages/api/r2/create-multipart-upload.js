// pages/api/r2/create-multipart-upload.js
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

// ✅ เพิ่ม config สำหรับ API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',  // สำหรับ JSON body (ไม่ใช่ไฟล์)
    },
    responseLimit: false,
    externalResolver: true,
  },
};

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 5, // ✅ เพิ่ม retry
  retryMode: 'adaptive',
  requestHandler: {
    timeout: 600000, // 10 นาที (สำหรับไฟล์ใหญ่)
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

export default async function handler(req, res) {
  // ✅ เพิ่ม timeout handler
  req.setTimeout(600000, () => {
    return res.status(408).json({ error: "Request timeout" });
  });

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  if (!adminIds.includes(session.user.id)) {
    return res.status(403).json({ error: "Admin only" });
  }

  const { fileName, contentType, action, uploadId, key, partNumber, parts } = req.body;

  const timestamp = Date.now();
  const safeName = fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `file_${timestamp}`;
  const fileKey = `products/${timestamp}_${safeName}`;

  try {
    // 1. CREATE Multipart Upload
    if (action === "create") {
      const command = new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType || "application/octet-stream",
      });
      
      const result = await s3Client.send(command);
      
      return res.status(200).json({
        success: true,
        uploadId: result.UploadId,
        key: fileKey,
      });
    }

    // 2. GET Presigned URL for Part
    if (action === "get-part-url") {
      const command = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      
      const partUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 7200, // 2 ชั่วโมง (เพิ่มจากเดิม)
      });
      
      return res.status(200).json({
        success: true,
        partUrl,
      });
    }

    // 3. COMPLETE Multipart Upload
    if (action === "complete") {
      const command = new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });
      
      await s3Client.send(command);
      
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      
      return res.status(200).json({
        success: true,
        publicUrl,
        key,
      });
    }

    // 4. ABORT Multipart Upload
    if (action === "abort") {
      const command = new AbortMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
      });
      
      await s3Client.send(command);
      
      return res.status(200).json({
        success: true,
        message: "Upload aborted",
      });
    }

    return res.status(400).json({ error: "Invalid action" });
    
  } catch (error) {
    console.error("Multipart upload error:", error);
    return res.status(500).json({ error: error.message });
  }
}