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

const EVENT_STYLES = {
  login:          { color: 0x10b981, title: '🔑 เข้าสู่ระบบ' },
  logout:         { color: 0x6b7280, title: '🚪 ออกจากระบบ' },
  purchase:       { color: 0xf59e0b, title: '🛒 ซื้อสินค้าสำเร็จ' },
  topup:          { color: 0x3b82f6, title: '💰 เติมเงิน' },
  product_add:    { color: 0x8b5cf6, title: '➕ เพิ่มสินค้าใหม่' },
  product_edit:   { color: 0xf59e0b, title: '✏️ แก้ไขสินค้า' },
  product_delete: { color: 0xef4444, title: '🗑️ ลบสินค้า' },
  product_update: { color: 0x06b6d4, title: '🔄 อัปเดตเวอร์ชัน' },
  user_edit:      { color: 0x8b5cf6, title: '👤 แก้ไขข้อมูลผู้ใช้' },
  file_upload:    { color: 0x10b981, title: '📤 อัปโหลดไฟล์' },
  file_delete:    { color: 0xef4444, title: '🗑️ ลบไฟล์' },
  error:          { color: 0xef4444, title: '❌ เกิดข้อผิดพลาด' },
  settings:       { color: 0x6366f1, title: '⚙️ ตั้งค่าระบบ' },
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

    const style = EVENT_STYLES[type] || { color: 0x6366f1, title: type };

    //  สร้าง Description พร้อม @Mention
    let description = message;

    //  ถ้ามี Discord ID → เพิ่ม @Mention ใน Description
    if (details.discordId) {
      description += `\n\n👤 **ผู้ใช้:** ${formatMention(details.discordId)}`;
    }

    //  Fields
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
      if (details.discordId) fields.push({ name: '👤 ผู้ใช้', value: formatMention(details.discordId), inline: true });
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
      if (details.discordId) fields.push({ name: '👤 ผู้ใช้', value: formatMention(details.discordId), inline: true });
      if (details.productName) fields.push({ name: '📦 สินค้า', value: `**${details.productName}**`, inline: true });
      if (details.version) fields.push({ name: '📌 เวอร์ชันใหม่', value: `**v${details.version}**`, inline: true });
    }

    // ==================== USER EDIT ====================
    if (type === 'user_edit') {
      if (details.discordId) fields.push({ name: '👤 ผู้ใช้', value: formatMention(details.discordId), inline: true });
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
      if (details.discordId) fields.push({ name: '👤 ผู้ใช้', value: formatMention(details.discordId), inline: true });
      if (details.error) fields.push({ name: '❌ รายละเอียด', value: '```\n' + String(details.error).substring(0, 1000) + '\n```', inline: false });
    }

    // ==================== LOGIN ====================
    if (type === 'login') {
      if (details.discordId) fields.push({ name: '👤 Discord', value: formatMention(details.discordId), inline: true });
      if (details.email) fields.push({ name: '📧 Email', value: details.email, inline: true });
    }

    // ==================== LOGOUT ====================
    if (type === 'logout') {
      if (details.discordId) fields.push({ name: '👤 Discord', value: formatMention(details.discordId), inline: true });
    }

    //  สร้าง Embed
    const embed = {
      author: {
        name: 'xCloud Studio',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png',
      },
      title: style.title,
      description: description,
      color: style.color,
      timestamp: new Date().toISOString(),
      footer: {
        text: `👤 ${user}`,
      },
    };

    if (fields.length > 0) {
      embed.fields = fields;
    }

    //  ส่ง Webhook
    console.log(`📤 Webhook: ${type} → ${eventWebhook.url.substring(0, 50)}...`);
    await axios.post(eventWebhook.url, {
      embeds: [embed],
      //  @Mention ใน content (จะ ping ถ้า webhook มี permission)
      content: details.discordId ? formatMention(details.discordId) : undefined,
      allowed_mentions: details.discordId ? { users: [details.discordId] } : undefined,
    });

    console.log(`✅ Webhook sent: ${type}`);

  } catch (err) {
    console.error('❌ Webhook error:', err.response?.data || err.message);
  }
}

export { addLog, LOG_TYPES };