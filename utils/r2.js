import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// ✅ สร้าง Presigned URL สำหรับอัปโหลด (ใช้ใน Frontend)
export async function getPresignedUploadUrl(fileName, contentType) {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `products/${timestamp}_${safeName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const publicUrl = `${process.env.R2_PUBLIC_URL || `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev`}/${key}`;
  
  return { uploadUrl, publicUrl, key };
}

// ✅ สร้าง Signed URL สำหรับดาวน์โหลด (ให้สิทธิ์ชั่วคราว)
export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}