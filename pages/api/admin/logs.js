import fs from 'fs';
import path from 'path';
import { requireAdmin, getSessionUserId, getAdminRole } from '@/utils/checkAdmin';
import { sameOrigin, rateLimit } from '@/utils/apiGuard';
import { sendWebhook } from '@/utils/logWebhook';

const LOG_FILE = path.join(process.cwd(), 'data', 'logs.json');
const MAX_LOGS = 5000; // กันไฟล์โตไม่สิ้นสุด (เดิมใครก็ยิง POST ถล่มให้ดิสก์เต็มได้)

// ประเภทที่ผู้ใช้ทั่วไปบันทึกได้ — ประเภทอื่น (product_add, user_edit ฯลฯ) ต้องเป็นแอดมิน
const USER_LOG_TYPES = new Set(['login', 'logout', 'page_view', 'error', 'topup', 'product_update']);

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
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(-MAX_LOGS), null, 2));
}

const clip = (value, max) => String(value ?? '').slice(0, max);

export default async function handler(req, res) {
  if (!sameOrigin(req, res)) return;

  if (req.method === 'GET' || req.method === 'DELETE') {
    const auth = await requireAdmin(req, res);
    if (!auth.isAdmin) {
      return res.status(auth.status).json({ error: auth.error });
    }
  }

  if (req.method === 'GET') {
    const { type, limit = 100 } = req.query;
    let logs = readLogs();

    if (type && type !== 'all') {
      logs = logs.filter(log => log.type === type);
    }

    logs = logs.slice(-Math.min(parseInt(limit) || 100, MAX_LOGS));

    return res.status(200).json({ logs: logs.reverse() });
  }

  if (req.method === 'POST') {
    // ต้องล็อกอิน และชื่อผู้ใช้/discordId ใน log มาจาก session เท่านั้น (กันปลอม log ในนามคนอื่น)
    const { session, userId } = await getSessionUserId(req, res);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!rateLimit(req, res, { key: 'logs', limit: 30, id: userId })) return;

    const { type, title, message, details } = req.body || {};
    if (typeof type !== 'string' || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!USER_LOG_TYPES.has(type) && !(await getAdminRole(userId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let safeDetails = details && typeof details === 'object' && !Array.isArray(details) ? details : {};
    if (JSON.stringify(safeDetails).length > 4000) safeDetails = { truncated: true };
    safeDetails.discordId = userId;
    const userName = clip(session.user.name || userId, 64);

    const entry = {
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type: clip(type, 32),
      title: clip(title, 120),
      message: clip(message, 1000),
      user: userName,
      details: safeDetails,
      createdAt: new Date().toISOString(),
    };

    const logs = readLogs();
    logs.push(entry);
    writeLogs(logs);

    sendWebhook(entry.type, entry.title, entry.message, userName, safeDetails).catch(() => {});

    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    writeLogs([]);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
