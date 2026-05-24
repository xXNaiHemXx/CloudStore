import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // ✅ ปิด bodyParser ใช้ formidable แทน
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ เพิ่ม timeout สำหรับไฟล์ใหญ่
  req.setTimeout(0); // ไม่มี timeout
  res.setTimeout(0);

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mods');
    
    // ✅ สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2000 * 1024 * 1024, // ✅ 2GB (2000MB)
      maxFieldsSize: 2000 * 1024 * 1024,
      maxTotalFileSize: 2000 * 1024 * 1024,
      allowEmptyFiles: false,
    });

    // ✅ แสดง progress
    form.on('progress', (bytesReceived, bytesExpected) => {
      const percent = Math.round((bytesReceived / bytesExpected) * 100);
      if (percent % 10 === 0) {
        console.log(`📤 Upload: ${percent}% (${(bytesReceived / (1024*1024)).toFixed(0)}MB / ${(bytesExpected / (1024*1024)).toFixed(0)}MB)`);
      }
    });

    // ✅ จัดการไฟล์
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;

    if (!file) {
      return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
    }

    // ✅ สร้างชื่อไฟล์ที่ปลอดภัย
    const originalName = file.originalFilename || 'file.zip';
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const safeName = `${baseName}_${Date.now()}${ext}`;
    const finalPath = path.join(uploadDir, safeName);

    // ✅ ย้ายไฟล์
    fs.renameSync(file.filepath, finalPath);

    const fileUrl = `/uploads/mods/${safeName}`;
    const fileSize = fs.statSync(finalPath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    console.log(`✅ Upload complete: ${safeName} (${fileSizeMB}MB)`);

    res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: safeName,
      originalName: originalName,
      size: fileSize,
      sizeMB: fileSizeMB,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: '❌ ไฟล์ใหญ่เกินไป (สูงสุด 2GB)' 
      });
    }
    
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการอัปโหลด',
      message: error.message 
    });
  }
}