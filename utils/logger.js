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

/**
 * ฟอร์แมต Discord ID เป็น Mention
 * @param {string} discordId - Discord User ID
 * @returns {string} <@discordId>
 */
function formatMention(discordId) {
  if (!discordId) return 'Unknown';
  return `<@${discordId}>`;
}

/**
 * ฟอร์แมต Role IDs เป็น Mention
 * @param {string[]} roleIds - Array of Role IDs
 * @returns {string} <@&roleId>
 */
function formatRoleMentions(roleIds) {
  if (!roleIds || roleIds.length === 0) return 'ไม่มี Role';
  return roleIds.map(id => `<@&${id}>`).join(', ');
}

/**
 * ดึง Username + Discord ID
 */
function getUserDisplay(userName, discordId) {
  if (discordId) {
    return `${userName || 'Unknown'} (${formatMention(discordId)})`;
  }
  return userName || 'System';
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

    // ✅ สร้าง fields จาก details
    const fields = [];
    
    if (details.discordId) {
      fields.push({ name: '👤 Discord User', value: formatMention(details.discordId), inline: true });
    }
    if (details.productName) {
      fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
    }
    if (details.price) {
      fields.push({ name: '💰 ราคา', value: `${details.price.toLocaleString()} Point`, inline: true });
    }
    if (details.amount) {
      fields.push({ name: '💵 จำนวนเงิน', value: `${details.amount.toLocaleString()} บาท`, inline: true });
    }
    if (details.version) {
      fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
    }
    if (details.oldVersion) {
      fields.push({ name: '📌 เวอร์ชันเก่า', value: `v${details.oldVersion}`, inline: true });
    }
    if (details.newVersion) {
      fields.push({ name: '📌 เวอร์ชันใหม่', value: `v${details.newVersion}`, inline: true });
    }
    if (details.roleIds && details.roleIds.length > 0) {
      fields.push({ name: '🎭 Role ที่ได้รับ', value: formatRoleMentions(details.roleIds), inline: false });
    }
    if (details.fileName) {
      fields.push({ name: '📁 ไฟล์', value: details.fileName, inline: true });
    }
    if (details.points) {
      fields.push({ name: '💎 แต้ม', value: `${details.points.toLocaleString()} Point`, inline: true });
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
    if (details.error) {
      fields.push({ name: '❌ Error', value: String(details.error).substring(0, 1024), inline: false });
    }

    await axios.post(eventWebhook.url, {
      embeds: [{
        title: `${title}`,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: { text: user },
        fields: fields.length > 0 ? fields : undefined,
      }],
    });

  } catch (err) {
    console.error('Webhook send error:', err.message);
  }
}

export { addLog, LOG_TYPES, formatMention, formatRoleMentions, getUserDisplay };