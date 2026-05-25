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

function formatMention(discordId) {
  if (!discordId) return null;
  return `<@${discordId}>`;
}

function formatRoleMentions(roleIds) {
  if (!roleIds || roleIds.length === 0) return null;
  return roleIds.map(id => `<@&${id}>`).join('\n');
}

async function addLog(type, title, message, user = 'System', details = {}) {
  try {
    await axios.post('/api/admin/logs', { type, title, message, user, details });
    console.log(`📝 Log: [${type}] ${title} - ${user}`);
    await sendWebhook(type, title, message, user, details);
  } catch (err) {
    console.error('Logger error:', err.message);
  }
}

async function sendWebhook(type, title, message, user, details) {
  try {
    const configRes = await axios.get('/api/admin/webhook');
    const config = configRes.data;
    if (!config.enabled) return;

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

    // ✅ สร้าง Description แบบสวยงาม
    let description = message;

    // ✅ เพิ่ม Discord Mention ถ้ามี
    if (details.discordId) {
      description += `\n\n👤 **Discord:** ${formatMention(details.discordId)}`;
    }

    // ✅ สร้าง Fields
    const fields = [];

    // --- PURCHASE ---
    if (type === 'purchase') {
      if (details.productName) {
        fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      }
      if (details.price !== undefined) {
        fields.push({ name: '💰 ราคา', value: `${details.price.toLocaleString()} Point`, inline: true });
      }
      if (details.version) {
        fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      }
      if (details.roleIds && details.roleIds.length > 0) {
        fields.push({ 
          name: '🎭 Role ที่ได้รับ', 
          value: formatRoleMentions(details.roleIds) || 'ไม่มี', 
          inline: false 
        });
      }
    }

    // --- TOPUP ---
    if (type === 'topup') {
      if (details.amount !== undefined) {
        fields.push({ name: '💵 จำนวนเงิน', value: `${details.amount.toLocaleString()} บาท`, inline: true });
        fields.push({ name: '💎 Point ที่ได้รับ', value: `${details.amount.toLocaleString()} Point`, inline: true });
      }
    }

    // --- PRODUCT ADD/EDIT ---
    if (type === 'product_add' || type === 'product_edit') {
      if (details.productName) {
        fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      }
      if (details.price !== undefined) {
        fields.push({ name: '💰 ราคา', value: `${details.price.toLocaleString()} Point`, inline: true });
      }
      if (details.version) {
        fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      }
      if (details.roleIds && details.roleIds.length > 0) {
        fields.push({ 
          name: '🎭 Auto Role', 
          value: formatRoleMentions(details.roleIds) || 'ไม่มี', 
          inline: false 
        });
      }
    }

    // --- PRODUCT DELETE ---
    if (type === 'product_delete') {
      if (details.productName) {
        fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      }
    }

    // --- PRODUCT UPDATE ---
    if (type === 'product_update') {
      if (details.productName) {
        fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      }
      if (details.version) {
        fields.push({ name: '📌 เวอร์ชันใหม่', value: `v${details.version}`, inline: true });
      }
    }

    // --- USER EDIT ---
    if (type === 'user_edit') {
      if (details.discordId) {
        fields.push({ name: '👤 Discord ID', value: details.discordId, inline: true });
      }
      if (details.oldPoints !== undefined) {
        fields.push({ name: '💎 แต้มก่อนหน้า', value: `${details.oldPoints.toLocaleString()} Point`, inline: true });
      }
      if (details.newPoints !== undefined) {
        fields.push({ name: '💎 แต้มใหม่', value: `${details.newPoints.toLocaleString()} Point`, inline: true });
      }
      if (details.email) {
        fields.push({ name: '📧 Email', value: details.email, inline: true });
      }
    }

    // --- FILE UPLOAD/DELETE ---
    if (type === 'file_upload' || type === 'file_delete') {
      if (details.fileName) {
        fields.push({ name: '📁 ไฟล์', value: details.fileName, inline: true });
      }
      if (details.fileSize) {
        fields.push({ name: '📏 ขนาด', value: details.fileSize, inline: true });
      }
    }

    // --- ERROR ---
    if (type === 'error') {
      if (details.error) {
        fields.push({ 
          name: '❌ รายละเอียดข้อผิดพลาด', 
          value: '```' + String(details.error).substring(0, 1000) + '```', 
          inline: false 
        });
      }
    }

    // ✅ ส่งไป Discord
    const embed = {
      title: title,
      description: description || undefined,
      color: color,
      timestamp: new Date().toISOString(),
      footer: { 
        text: user,
        icon_url: 'https://cdn.discordapp.com/emojis/1234567890.png' // optional
      },
    };

    if (fields.length > 0) {
      embed.fields = fields;
    }

    await axios.post(eventWebhook.url, {
      embeds: [embed],
      // ✅ ถ้ามี Discord ID ให้ @mention (แต่จะไม่ส่ง notification ถ้าเป็น webhook)
      content: details.discordId ? formatMention(details.discordId) : undefined,
      allowed_mentions: details.discordId ? { users: [details.discordId] } : undefined,
    });

  } catch (err) {
    console.error('Webhook send error:', err.message);
  }
}

export { addLog, LOG_TYPES };