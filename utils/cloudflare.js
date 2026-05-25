import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

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
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev`;

//  สร้าง presigned URL สำหรับอัปโหลด (วิธีง่าย - ไฟล์เดียว)
export async function getPresignedUploadUrl(key, contentType, expiresIn = 3600) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { success: true, url, key };
  } catch (error) {
    console.error("Create presigned URL error:", error);
    return { success: false, error: error.message };
  }
}

//  เริ่มการอัปโหลดแบบ Multipart (สำหรับไฟล์ใหญ่)
export async function initiateMultipartUpload(key, contentType) {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    
    const result = await s3Client.send(command);
    return { success: true, uploadId: result.UploadId, key };
  } catch (error) {
    console.error("Initiate multipart upload error:", error);
    return { success: false, error: error.message };
  }
}

//  อัปโหลด Part (ส่วนของไฟล์)
export async function getPartUploadUrl(key, uploadId, partNumber, expiresIn = 3600) {
  try {
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { success: true, url };
  } catch (error) {
    console.error("Get part upload URL error:", error);
    return { success: false, error: error.message };
  }
}

//  เสร็จสิ้นการอัปโหลด Multipart
export async function completeMultipartUpload(key, uploadId, parts) {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part, index) => ({
          PartNumber: index + 1,
          ETag: part.ETag,
        })),
      },
    });
    
    const result = await s3Client.send(command);
    return { success: true, location: result.Location };
  } catch (error) {
    console.error("Complete multipart upload error:", error);
    return { success: false, error: error.message };
  }
}

// ... ฟังก์ชันอื่นๆ (getSignedDownloadUrl, deleteFileFromR2, fileExists)