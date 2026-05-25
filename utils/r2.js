import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// =========================
// Upload URL
// =========================
export async function getPresignedUploadUrl(
  fileName,
  contentType = "application/octet-stream"
) {
  const timestamp = Date.now();

  const safeName = fileName.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const key = `products/${safeName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(
    s3Client,
    command,
    {
      expiresIn: 60 * 60,
    }
  );

  const publicUrl =
    `${process.env.R2_PUBLIC_URL}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
  };
}

// =========================
// Download URL
// =========================
export async function getSignedDownloadUrl(
  key,
  expiresIn = 3600
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(
    s3Client,
    command,
    { expiresIn }
  );
}