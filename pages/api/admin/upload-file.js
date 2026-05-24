import formidable from "formidable";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ตรวจสอบ method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ตรวจสอบสิทธิ์ Admin
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
  if (!adminIds.includes(session.user.id)) {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    // กำหนดโฟลเดอร์สำหรับเก็บไฟล์
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // ✅ ตั้งค่า formidable (ไม่เพิ่ม timestamp)
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2000 * 1024 * 1024, // 2GB
      filename: (name, ext, part, form) => {
        // ✅ คืนชื่อไฟล์เดิม ไม่เติมเลข
        const originalName = part.originalFilename || "file";
        // แทนที่ช่องว่างและอักขระพิเศษ
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        return safeName;
      },
    });

    // parse form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // รับไฟล์
    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ ใช้ชื่อไฟล์เดิม (ไม่เปลี่ยน)
    const originalName = file.originalFilename || path.basename(file.filepath);
    const fileName = originalName;
    const fileUrl = `/uploads/${fileName}`;

    // ✅ ถ้าไฟล์ซ้ำ ให้เปลี่ยนชื่อ (เพิ่ม _1, _2)
    let finalFileName = fileName;
    let finalFilePath = path.join(uploadDir, finalFileName);
    let counter = 1;
    
    while (fs.existsSync(finalFilePath)) {
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      finalFileName = `${baseName}_${counter}${ext}`;
      finalFilePath = path.join(uploadDir, finalFileName);
      counter++;
    }
    
    // ✅ ย้ายไฟล์ไปยังชื่อใหม่ (ถ้าชื่อซ้ำ)
    if (finalFileName !== fileName) {
      fs.renameSync(file.filepath, finalFilePath);
    }

    const finalFileUrl = `/uploads/${finalFileName}`;

    console.log("✅ Upload success:", {
      originalName,
      fileName: finalFileName,
      url: finalFileUrl,
      size: file.size,
    });

    return res.status(200).json({
      success: true,
      message: "อัปโหลดสำเร็จ",
      url: finalFileUrl,
      originalName: finalFileName,
      fileName: finalFileName,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
}