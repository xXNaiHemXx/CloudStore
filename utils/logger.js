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
  return roleIds.map(id => `<@&${id}>`).join(', ');
}

// ✅ ดีไซน์ใหม่ - มี thumbnail, author, footer
const EVENT_STYLES = {
  login: {
    color: 0x10b981,
    title: '🔑 เข้าสู่ระบบ',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/1828/1828391.png',
  },
  logout: {
    color: 0x6b7280,
    title: '🚪 ออกจากระบบ',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/1828/1828427.png',
  },
  purchase: {
    color: 0xf59e0b,
    title: '🛒 ซื้อสินค้าสำเร็จ',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3500/3500833.png',
  },
  topup: {
    color: 0x3b82f6,
    title: '💰 เติมเงิน',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
  },
  product_add: {
    color: 0x8b5cf6,
    title: '➕ เพิ่มสินค้าใหม่',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
  },
  product_edit: {
    color: 0xf59e0b,
    title: '✏️ แก้ไขสินค้า',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/1159/1159633.png',
  },
  product_delete: {
    color: 0xef4444,
    title: '🗑️ ลบสินค้า',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3096/3096673.png',
  },
  product_update: {
    color: 0x06b6d4,
    title: '🔄 อัปเดตเวอร์ชัน',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/2592/2592351.png',
  },
  user_edit: {
    color: 0x8b5cf6,
    title: '👤 แก้ไขข้อมูลผู้ใช้',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png',
  },
  file_upload: {
    color: 0x10b981,
    title: '📤 อัปโหลดไฟล์',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/2944/2944100.png',
  },
  file_delete: {
    color: 0xef4444,
    title: '🗑️ ลบไฟล์',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3096/3096673.png',
  },
  error: {
    color: 0xef4444,
    title: '❌ เกิดข้อผิดพลาด',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  },
  settings: {
    color: 0x6366f1,
    title: '⚙️ ตั้งค่าระบบ',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3524/3524659.png',
  },
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

async function sendWebhook(type, title, message, user, details) {
  try {
    const configRes = await axios.get('/api/admin/webhook');
    const config = configRes.data;
    if (!config.enabled) return;

    const eventWebhook = config.webhooks?.[type];
    if (!eventWebhook?.enabled || !eventWebhook?.url) {
      console.log(`⏭️ Webhook skipped: ${type}`);
      return;
    }

    const style = EVENT_STYLES[type] || { color: 0x6366f1, title: type, thumbnail: null };

    // ✅ สร้าง Fields
    const fields = [];

    // ==================== PURCHASE ====================
    if (type === 'purchase') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: `**${details.productName}**`, inline: true });
      if (details.price !== undefined) fields.push({ name: '💰 ราคา', value: `**${details.price.toLocaleString()}** Point`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      if (details.roleIds?.length > 0) fields.push({ name: '🎭 Role ที่ได้รับ', value: formatRoleMentions(details.roleIds), inline: false });
    }

    // ==================== TOPUP ====================
    if (type === 'topup') {
      if (details.amount !== undefined) {
        fields.push({ name: '💵 จำนวนเงิน', value: `**${details.amount.toLocaleString()}** บาท`, inline: true });
        fields.push({ name: '💎 Point ที่ได้รับ', value: `**${details.amount.toLocaleString()}** Point`, inline: true });
      }
    }

    // ==================== PRODUCT ADD/EDIT ====================
    if (type === 'product_add' || type === 'product_edit') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: `**${details.productName}**`, inline: true });
      if (details.price !== undefined) fields.push({ name: '💰 ราคา', value: `**${details.price.toLocaleString()}** Point`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      if (details.roleIds?.length > 0) fields.push({ name: '🎭 Auto Role', value: formatRoleMentions(details.roleIds), inline: false });
    }

    // ==================== PRODUCT DELETE ====================
    if (type === 'product_delete') {
      if (details.productName) fields.push({ name: '📦 สินค้าที่ลบ', value: `**${details.productName}**`, inline: true });
    }

    // ==================== PRODUCT UPDATE ====================
    if (type === 'product_update') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: `**${details.productName}**`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชันใหม่', value: `**v${details.version}**`, inline: true });
    }

    // ==================== USER EDIT ====================
    if (type === 'user_edit') {
      if (details.discordId) fields.push({ name: '👤 Discord', value: formatMention(details.discordId), inline: true });
      if (details.oldPoints !== undefined) fields.push({ name: '💎 แต้มก่อนหน้า', value: `${details.oldPoints.toLocaleString()} Point`, inline: true });
      if (details.newPoints !== undefined) fields.push({ name: '💎 แต้มใหม่', value: `**${details.newPoints.toLocaleString()}** Point`, inline: true });
      if (details.email) fields.push({ name: '📧 Email', value: details.email, inline: true });
    }

    // ==================== FILE UPLOAD/DELETE ====================
    if (type === 'file_upload' || type === 'file_delete') {
      if (details.fileName) fields.push({ name: '📁 ไฟล์', value: `\`${details.fileName}\``, inline: false });
      if (details.fileSize) fields.push({ name: '📏 ขนาด', value: details.fileSize, inline: true });
    }

    // ==================== ERROR ====================
    if (type === 'error') {
      if (details.error) fields.push({ name: '❌ รายละเอียด', value: '```\n' + String(details.error).substring(0, 1000) + '\n```', inline: false });
    }

    // ==================== LOGIN ====================
    if (type === 'login') {
      if (details.email) fields.push({ name: '📧 Email', value: details.email, inline: true });
      if (details.discordId) fields.push({ name: '🆔 Discord ID', value: `\`${details.discordId}\``, inline: true });
    }

    // ==================== LOGOUT ====================
    if (type === 'logout') {
      if (details.discordId) fields.push({ name: '🆔 Discord ID', value: `\`${details.discordId}\``, inline: true });
    }

    // ✅ สร้าง Embed
    const embed = {
      author: {
        name: 'xCloud Studio',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png',
      },
      title: style.title,
      description: message,
      color: style.color,
      timestamp: new Date().toISOString(),
      footer: {
        text: `👤 ${user}`,
        icon_url: details.avatarUrl || undefined,
      },
    };

    // ✅ เพิ่ม Thumbnail
    if (style.thumbnail) {
      embed.thumbnail = { url: style.thumbnail };
    }

    // ✅ เพิ่ม Fields
    if (fields.length > 0) {
      embed.fields = fields;
    }

    // ✅ เพิ่ม Image (ถ้ามี)
    if (details.imageUrl) {
      embed.image = { url: details.imageUrl };
    }

    console.log(`📤 Sending webhook: ${type} → ${eventWebhook.url.substring(0, 50)}...`);
    await axios.post(eventWebhook.url, {
      embeds: [embed],
      content: details.discordId ? formatMention(details.discordId) : undefined,
      allowed_mentions: details.discordId ? { users: [details.discordId] } : undefined,
    });

    console.log(`✅ Webhook sent: ${type}`);

  } catch (err) {
    console.error('❌ Webhook error:', err.response?.data || err.message);
  }
}

export { addLog, LOG_TYPES };