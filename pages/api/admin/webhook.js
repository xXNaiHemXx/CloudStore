import fs from 'fs';
import path from 'path';

const WEBHOOK_FILE = path.join(process.cwd(), 'data', 'webhook.json');

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(WEBHOOK_FILE)) {
  //  โครงสร้างใหม่: แต่ละ event มี webhook ของตัวเอง
  fs.writeFileSync(WEBHOOK_FILE, JSON.stringify({
    enabled: false,
    webhooks: {
      login: { url: '', enabled: true },
      logout: { url: '', enabled: true },
      purchase: { url: '', enabled: true },
      topup: { url: '', enabled: true },
      product_add: { url: '', enabled: true },
      product_edit: { url: '', enabled: true },
      product_delete: { url: '', enabled: true },
      product_update: { url: '', enabled: true },
      user_edit: { url: '', enabled: true },
      file_upload: { url: '', enabled: true },
      file_delete: { url: '', enabled: true },
      error: { url: '', enabled: true },
    },
  }, null, 2));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const config = JSON.parse(fs.readFileSync(WEBHOOK_FILE, 'utf-8'));
      return res.status(200).json(config);
    } catch {
      return res.status(200).json({ enabled: false, webhooks: {} });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { enabled, webhooks } = req.body;
      fs.writeFileSync(WEBHOOK_FILE, JSON.stringify({ enabled, webhooks }, null, 2));
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}