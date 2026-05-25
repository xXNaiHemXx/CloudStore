import fs from 'fs';
import path from 'path';

const WEBHOOK_FILE = path.join(process.cwd(), 'data', 'webhook.json');

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(WEBHOOK_FILE)) {
  fs.writeFileSync(WEBHOOK_FILE, JSON.stringify({
    discordWebhook: '',
    enabled: false,
    events: ['login', 'purchase', 'topup', 'product_add', 'error'],
  }));
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const config = JSON.parse(fs.readFileSync(WEBHOOK_FILE, 'utf-8'));
    return res.status(200).json(config);
  }
  
  if (req.method === 'PUT') {
    const { discordWebhook, enabled, events } = req.body;
    const config = { discordWebhook, enabled, events };
    fs.writeFileSync(WEBHOOK_FILE, JSON.stringify(config, null, 2));
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}