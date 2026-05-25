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

const EVENT_STYLES = {
  login:          { emoji: '🔑', color: 0x10b981, label: 'ล็อคอิน' },
  logout:         { emoji: '🚪', color: 0x6b7280, label: 'ล็อคเอาท์' },
  purchase:       { emoji: '🛒', color: 0xf59e0b, label: 'ซื้อสินค้า' },
  topup:          { emoji: '💰', color: 0x3b82f6, label: 'เติมเงิน' },
  product_add:    { emoji: '➕', color: 0x8b5cf6, label: 'เพิ่มสินค้า' },
  product_edit:   { emoji: '✏️', color: 0xf59e0b, label: 'แก้ไขสินค้า' },
  product_delete: { emoji: '🗑️', color: 0xef4444, label: 'ลบสินค้า' },
  product_update: { emoji: '🔄', color: 0x06b6d4, label: 'อัปเดตเวอร์ชัน' },
  user_edit:      { emoji: '👤', color: 0x8b5cf6, label: 'แก้ไขผู้ใช้' },
  file_upload:    { emoji: '📤', color: 0x10b981, label: 'อัปโหลดไฟล์' },
  file_delete:    { emoji: '🗑️', color: 0xef4444, label: 'ลบไฟล์' },
  error:          { emoji: '❌', color: 0xef4444, label: 'ข้อผิดพลาด' },
  settings:       { emoji: '⚙️', color: 0x6366f1, label: 'ตั้งค่า' },
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
      console.log(`⏭️ Webhook skipped: ${type} (not configured)`);
      return;
    }

    const style = EVENT_STYLES[type] || { emoji: '📋', color: 0x6366f1, label: type };

    // ✅ Title พร้อม Emoji
    const embedTitle = `${style.emoji} ${title}`;

    // ✅ Description
    let description = message;

    // ✅ Discord Mention
    if (details.discordId) {
      description += `\n\n👤 **Discord:** ${formatMention(details.discordId)}`;
    }

    // ✅ Fields
    const fields = [];

    if (type === 'purchase') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      if (details.price !== undefined) fields.push({ name: '💰 ราคา', value: `${details.price.toLocaleString()} Point`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      if (details.roleIds?.length > 0) fields.push({ name: '🎭 Role ที่ได้รับ', value: formatRoleMentions(details.roleIds) || 'ไม่มี', inline: false });
    }

    if (type === 'topup') {
      if (details.amount !== undefined) {
        fields.push({ name: '💵 จำนวนเงิน', value: `${details.amount.toLocaleString()} บาท`, inline: true });
        fields.push({ name: '💎 Point ที่ได้รับ', value: `${details.amount.toLocaleString()} Point`, inline: true });
      }
    }

    if (type === 'product_add' || type === 'product_edit') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      if (details.price !== undefined) fields.push({ name: '💰 ราคา', value: `${details.price.toLocaleString()} Point`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชัน', value: `v${details.version}`, inline: true });
      if (details.roleIds?.length > 0) fields.push({ name: '🎭 Auto Role', value: formatRoleMentions(details.roleIds) || 'ไม่มี', inline: false });
    }

    if (type === 'product_delete') {
      if (details.productName) fields.push({ name: '📦 สินค้าที่ลบ', value: details.productName, inline: true });
    }

    if (type === 'product_update') {
      if (details.productName) fields.push({ name: '📦 สินค้า', value: details.productName, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชันใหม่', value: `v${details.version}`, inline: true });
    }

    if (type === 'user_edit') {
      if (details.discordId) fields.push({ name: '👤 Discord ID', value: details.discordId, inline: true });
      if (details.oldPoints !== undefined) fields.push({ name: '💎 แต้มก่อนหน้า', value: `${details.oldPoints.toLocaleString()} Point`, inline: true });
      if (details.newPoints !== undefined) fields.push({ name: '💎 แต้มใหม่', value: `${details.newPoints.toLocaleString()} Point`, inline: true });
      if (details.email) fields.push({ name: '📧 Email', value: details.email, inline: true });
    }

    if (type === 'file_upload' || type === 'file_delete') {
      if (details.fileName) fields.push({ name: '📁 ไฟล์', value: details.fileName, inline: true });
      if (details.fileSize) fields.push({ name: '📏 ขนาด', value: details.fileSize, inline: true });
    }

    if (type === 'error') {
      if (details.error) fields.push({ name: '❌ รายละเอียด', value: '```' + String(details.error).substring(0, 1000) + '```', inline: false });
    }

    if (type === 'login') {
      if (details.email) fields.push({ name: '📧 Email', value: details.email, inline: true });
      if (details.discordId) fields.push({ name: '🆔 Discord ID', value: details.discordId, inline: true });
    }

    if (type === 'logout') {
      if (details.discordId) fields.push({ name: '🆔 Discord ID', value: details.discordId, inline: true });
    }

    // ✅ สร้าง Embed
    const embed = {
      title: embedTitle,
      description: description || undefined,
      color: style.color,
      timestamp: new Date().toISOString(),
      footer: { text: user },
    };

    if (fields.length > 0) {
      embed.fields = fields;
    }

    // ✅ ส่งไป Discord
    console.log(`📤 Sending webhook to: ${eventWebhook.url.substring(0, 50)}...`);
    await axios.post(eventWebhook.url, {
      embeds: [embed],
      content: details.discordId ? formatMention(details.discordId) : undefined,
      allowed_mentions: details.discordId ? { users: [details.discordId] } : undefined,
    });

    console.log(`✅ Webhook sent: ${type}`);

  } catch (err) {
    console.error('❌ Webhook send error:', err.response?.data || err.message);
  }
}

export { addLog, LOG_TYPES };