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

    // ✅ ตั้งค่า formidable (ไม่เพิ่ม timestamp และไม่เปลี่ยนชื่อ)
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2000 * 1024 * 1024, // 2GB
      filename: (name, ext, part, form) => {
        // ✅ ใช้ชื่อไฟล์เดิมทุกประการ
        const originalName = part.originalFilename || "file";
        // แทนที่เฉพาะช่องว่างและอักขระพิเศษ (ถ้าต้องการ)
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

    // ✅ ใช้ชื่อไฟล์เดิม
    const originalName = file.originalFilename || path.basename(file.filepath);
    const finalFileName = originalName;
    const finalFilePath = path.join(uploadDir, finalFileName);
    const finalFileUrl = `/uploads/${finalFileName}`;

    // ✅ ถ้าไฟล์มีอยู่แล้ว ให้ลบไฟล์เก่าก่อน แล้วเขียนทับ
    if (fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
      console.log(`📌 ลบไฟล์เก่า: ${finalFileName}`);
    }

    // ✅ ย้ายไฟล์ไปยังตำแหน่งสุดท้าย (เขียนทับ)
    fs.renameSync(file.filepath, finalFilePath);

    console.log("✅ Upload success (overwrite):", {
      originalName,
      fileName: finalFileName,
      url: finalFileUrl,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      overwritten: true
    });

    return res.status(200).json({
      success: true,
      message: "อัปโหลดสำเร็จ (เขียนทับไฟล์เดิม)",
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