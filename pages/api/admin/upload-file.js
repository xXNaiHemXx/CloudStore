import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // ✅ ปิด bodyParser เพื่อใช้ formidable
    responseLimit: false, // ✅ ไม่จำกัด response size
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mods');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // ✅ 500MB
      maxFieldsSize: 500 * 1024 * 1024, // ✅ 500MB
      maxTotalFileSize: 500 * 1024 * 1024, // ✅ 500MB
      allowEmptyFiles: false,
    });

    // ✅ แสดง progress (optional)
    form.on('progress', (bytesReceived, bytesExpected) => {
      const percent = Math.round((bytesReceived * 100) / bytesExpected);
      console.log(`📤 Upload progress: ${percent}%`);
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

    // ✅ สร้าง URL สำหรับไฟล์
    const fileName = file.newFilename || file.originalFilename;
    const fileUrl = `/uploads/mods/${fileName}`;

    // ✅ ตรวจสอบว่าไฟล์ถูกย้ายไปยัง public/uploads/mods
    const targetPath = path.join(uploadDir, fileName);
    
    if (file.filepath !== targetPath) {
      fs.renameSync(file.filepath, targetPath);
    }

    console.log(`✅ File uploaded: ${fileName} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

    res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: file.originalFilename,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // ✅ ตรวจสอบ error ประเภทต่างๆ
    if (error.httpCode === 413 || error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: '❌ ไฟล์ใหญ่เกิน 500MB\n\n💡 แนะนำ:\n- บีบอัดไฟล์\n- แบ่งไฟล์เป็นส่วนๆ\n- ใช้ลิงก์ภายนอก (Google Drive, Dropbox)' 
      });
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(408).json({ 
        error: '❌ อัปโหลดใช้เวลานานเกินไป\n\n💡 แนะนำ: ใช้ลิงก์ภายนอกแทน' 
      });
    }

    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการอัปโหลด',
      detail: error.message 
    });
  }
}