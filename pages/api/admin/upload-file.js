import formidable from "formidable";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

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
      allowEmptyFiles: false,
      //  เพิ่ม timeout ให้ formidable
      timeout: 30 * 60 * 1000, // 30 minutes
      filename: (name, ext, part, form) => {
        return part.originalFilename || "file";
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

    const originalName = file.originalFilename || path.basename(file.filepath);
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