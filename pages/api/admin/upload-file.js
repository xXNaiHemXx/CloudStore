import formidable from "formidable";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/utils/checkAdmin";
import { sameOrigin } from "@/utils/apiGuard";
import { isBlockedUpload } from "@/utils/uploadPolicy";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  //  ตั้ง timeout สูงสุด 30 นาที
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOrigin(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth.isAdmin) {
    return res.status(auth.status).json({ error: auth.error });
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
      allowEmptyFiles: false,
      //  เพิ่ม timeout ให้ formidable
      timeout: 30 * 60 * 1000, // 30 minutes
      filename: (name, ext, part, form) => {
        // ชื่อไฟล์ชั่วคราวสุ่มเอง ห้ามใช้ชื่อจาก client ตรงๆ (กัน path traversal เช่น ../../pages/x.js)
        return `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      },
    });

    let lastProgress = 0;
    form.on('progress', (bytesReceived, bytesExpected) => {
      const percent = Math.round((bytesReceived / bytesExpected) * 100);
      if (percent !== lastProgress && percent % 10 === 0) {
        lastProgress = percent;
        console.log(`📤 Upload progress: ${percent}% (${(bytesReceived / 1024 / 1024).toFixed(2)}MB / ${(bytesExpected / 1024 / 1024).toFixed(2)}MB)`);
      }
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

    if (!fs.existsSync(file.filepath)) {
      console.error("❌ Source file not found:", file.filepath);
      return res.status(500).json({ error: "Source file not found" });
    }

    const fileSizeMB = file.size / (1024 * 1024);
    
    if (file.size > 2000 * 1024 * 1024) {
      try { fs.unlinkSync(file.filepath); } catch(e) {}
      return res.status(413).json({ 
        error: `ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด 2GB)` 
      });
    }

    const originalName = path.basename(file.originalFilename || "file").replace(/[^\w.\-ก-๙ ]/g, "_");
    if (isBlockedUpload(originalName)) {
      try { fs.unlinkSync(file.filepath); } catch (e) {}
      return res.status(400).json({ error: "ไม่อนุญาตไฟล์ประเภทนี้" });
    }
    const finalFileName = originalName;
    const finalFilePath = path.join(uploadDir, finalFileName);
    const finalFileUrl = `/uploads/${finalFileName}`;

    //  ถ้าชื่อไฟล์เดียวกัน ให้ข้าม
    if (file.filepath !== finalFilePath) {
      if (fs.existsSync(finalFilePath)) {
        fs.unlinkSync(finalFilePath);
        console.log(`📌 ลบไฟล์เก่า: ${finalFileName}`);
      }
      fs.renameSync(file.filepath, finalFilePath);
      console.log(`📌 ย้ายไฟล์ไป: ${finalFilePath}`);
    } else {
      console.log(`✅ File already in correct location: ${finalFileName}`);
    }

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