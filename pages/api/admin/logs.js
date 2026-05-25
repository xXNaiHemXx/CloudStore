import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'data', 'logs.json');

// สร้างไฟล์ถ้ายังไม่มี
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '[]');
}

function readLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { type, limit = 100 } = req.query;
    let logs = readLogs();
    
    // กรองตามประเภท
    if (type && type !== 'all') {
      logs = logs.filter(log => log.type === type);
    }
    
    // เอาแค่จำนวนที่กำหนด (ล่าสุดก่อน)
    logs = logs.slice(-parseInt(limit));
    
    return res.status(200).json({ logs: logs.reverse() });
  }
  
  if (req.method === 'POST') {
    // ✅ เพิ่ม log ใหม่
    const { type, title, message, user, details } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const logs = readLogs();
    
    logs.push({
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type,        // login, logout, purchase, topup, product_add, product_edit, product_delete, etc.
      title,
      message,
      user: user || 'System',
      details: details || {},
      createdAt: new Date().toISOString(),
    });
    
    writeLogs(logs);
    
    return res.status(200).json({ success: true });
  }
  
  if (req.method === 'DELETE') {
    writeLogs([]);
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}