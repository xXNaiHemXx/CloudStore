import axios from 'axios';

const LOG_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PURCHASE: 'purchase',
  TOPUP: 'topup',
  PRODUCT_ADD: 'product_add',
  PRODUCT_EDIT: 'product_edit',
  PRODUCT_DELETE: 'product_delete',
  PRODUCT_UPDATE: 'product_update',
  USER_EDIT: 'user_edit',
  FILE_UPLOAD: 'file_upload',
  FILE_DELETE: 'file_delete',
  SETTINGS: 'settings',
  ERROR: 'error',
};

async function addLog(type, title, message, user = 'System', details = {}) {
  try {
    await axios.post('/api/admin/logs', { type, title, message, user, details });
    console.log(`📝 Log: [${type}] ${title} - ${user}`);

    await sendWebhook(type, title, message, user, details);
  } catch (err) {
    console.error('Logger error:', err.message);
  }
}

// ✅ ส่ง Webhook ตาม event
async function sendWebhook(type, title, message, user, details) {
  try {
    const configRes = await axios.get('/api/admin/webhook');
    const config = configRes.data;

    // ✅ เช็ค overall enabled
    if (!config.enabled) return;

    // ✅ ดึง webhook ของ event นี้
    const eventWebhook = config.webhooks?.[type];
    if (!eventWebhook?.enabled || !eventWebhook?.url) return;

    const colors = {
      login: 0x10b981,
      logout: 0x6b7280,
      purchase: 0xf59e0b,
      topup: 0x3b82f6,
      product_add: 0x8b5cf6,
      product_edit: 0xf59e0b,
      product_delete: 0xef4444,
      product_update: 0x06b6d4,
      user_edit: 0x8b5cf6,
      file_upload: 0x10b981,
      file_delete: 0xef4444,
      error: 0xef4444,
    };

    const color = colors[type] || 0x6366f1;

    // ✅ ส่งไป Webhook URL ของ event นั้น
    await axios.post(eventWebhook.url, {
      embeds: [{
        title: `${title}`,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: { text: user },
        fields: details && Object.keys(details).length > 0 ?
          Object.entries(details).map(([key, value]) => ({
            name: key,
            value: String(value).substring(0, 1024),
            inline: true,
          })) : [],
      }],
    });

  } catch (err) {
    console.error('Webhook send error:', err.message);
  }
}

export { addLog, LOG_TYPES };