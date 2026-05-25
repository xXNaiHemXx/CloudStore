import formidable from "formidable";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
    // ✅ เพิ่ม timeout และ size limit
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // ✅ ตั้ง timeout สูงสุด (10 นาที)
  req.setTimeout(10 * 60 * 1000); // 10 นาที
  
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
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2000 * 1024 * 1024, // 2GB
      multiples: false,
      // ✅ เพิ่ม timeout และ event handlers
      allowEmptyFiles: false,
      // ✅ ไม่ต้องเปลี่ยนชื่อไฟล์
      filename: (name, ext, part, form) => {
        return part.originalFilename || "file";
      },
    });

    // ✅ เพิ่ม progress event
    let progress = 0;
    form.on('progress', (bytesReceived, bytesExpected) => {
      progress = (bytesReceived / bytesExpected) * 100;
      console.log(`📤 Upload progress: ${progress.toFixed(2)}%`);
    });

    // ✅ เพิ่ม error handling
    form.on('error', (err) => {
      console.error("Formidable error:", err);
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileSizeMB = file.size / (1024 * 1024);
    
    if (file.size > 2000 * 1024 * 1024) {
      fs.unlinkSync(file.filepath);
      return res.status(413).json({ 
        error: `ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด 2048MB / 2GB)` 
      });
    }

    const originalName = file.originalFilename || path.basename(file.filepath);
    const finalFileName = originalName;
    const finalFilePath = path.join(uploadDir, finalFileName);
    const finalFileUrl = `/uploads/${finalFileName}`;

    if (fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
      console.log(`📌 ลบไฟล์เก่า: ${finalFileName}`);
    }

    fs.renameSync(file.filepath, finalFilePath);

    console.log(`✅ Upload success: ${finalFileName} (${fileSizeMB.toFixed(2)}MB)`);

    return res.status(200).json({
      success: true,
      message: "อัปโหลดสำเร็จ",
      url: finalFileUrl,
      originalName: finalFileName,
      fileName: finalFileName,
      size: file.size,
      sizeMB: fileSizeMB.toFixed(2),
    });

  } catch (error) {
    console.error("Upload error:", error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: "❌ ไฟล์ใหญ่เกินไป (สูงสุด 2GB)" });
    }
    
    return res.status(500).json({ error: error.message });
  }
}