import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ GET - ดึงรายการไฟล์ทั้งหมด
  if (req.method === 'GET') {
    return handleGetFiles(req, res);
  }

  // ✅ DELETE - ลบไฟล์
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  // ✅ POST - อัปโหลดไฟล์
  if (req.method === 'POST') {
    return handleUpload(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ✅ ฟังก์ชันดึงรายการไฟล์
async function handleGetFiles(req, res) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      return res.status(200).json([]);
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => {
        const filePath = path.join(uploadDir, file);
        return fs.statSync(filePath).isFile();
      })
      .map(file => `/uploads/${file}`);

    console.log(`📁 Found ${files.length} files`);
    
    res.status(200).json(files);

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดรายการไฟล์ได้' });
  }
}

// ✅ ฟังก์ชันอัปโหลด
async function handleUpload(req, res) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2000 * 1024 * 1024,
      allowEmptyFiles: false,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;

    if (!file) {
      return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
    }

    const originalName = file.originalFilename || 'file';
    const ext = path.extname(originalName).toLowerCase();
    const uniqueId = Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const safeName = `${uniqueId}${ext}`;
    const finalPath = path.join(uploadDir, safeName);

    fs.renameSync(file.filepath, finalPath);

    const fileUrl = `/uploads/${safeName}`;

    console.log(`✅ Uploaded: ${safeName}`);

    res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: safeName,
      originalName: originalName,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '❌ ไฟล์ใหญ่เกินไป (สูงสุด 2GB)' });
    }
    
    res.status(500).json({ error: error.message || 'อัปโหลดไม่สำเร็จ' });
  }
}

// ✅ ฟังก์ชันลบไฟล์
async function handleDelete(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const { fileName } = body;

    console.log('🗑️ Delete request:', fileName);

    if (!fileName) {
      return res.status(400).json({ error: 'Missing fileName' });
    }

    const safeName = path.basename(fileName);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeName);

    console.log('📁 File path:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', filePath);
      return res.status(404).json({ error: 'ไม่พบไฟล์: ' + safeName });
    }

    fs.unlinkSync(filePath);
    console.log('✅ Deleted:', safeName);

    res.status(200).json({ success: true, message: 'ลบไฟล์สำเร็จ' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'ลบไฟล์ไม่สำเร็จ' });
  }
}