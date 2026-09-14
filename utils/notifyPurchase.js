// utils/notifyPurchase.js
//
// ⚠️ ไฟล์นี้ใช้ฝั่งเซิร์ฟเวอร์ (API routes) เท่านั้น ห้าม import จากไฟล์หน้าเว็บ (pages/*.jsx)
// เหตุผลที่ต้องแยกออกมา:
//   เดิมทีการยิง Discord webhook ทำจาก browser ของผู้ใช้ (utils/logger.js -> sendWebhook)
//   โดยต้องเรียก GET /api/admin/webhook เพื่อไปเอา URL webhook มาก่อน
//   แต่ endpoint นั้นบังคับต้องเป็นแอดมิน (requireAdmin) เท่านั้นถึงจะเรียกได้
//   ผลคือ "ลูกค้าทั่วไป" ที่ไม่ใช่แอดมินจะเรียกไม่ผ่าน -> โดน 403 เงียบๆ
//   -> Discord ไม่เคยได้รับการแจ้งเตือนการซื้อของลูกค้าทั่วไปเลย (แต่ log บนเว็บบันทึกได้ปกติ
//      เพราะ POST /api/admin/logs เปิดให้ทุกคนเรียกได้)
//
// วิธีแก้: อ่านไฟล์ webhook.json ตรงๆ ฝั่งเซิร์ฟเวอร์ แล้วยิงเข้า Discord จากฝั่งเซิร์ฟเวอร์เลย
// ไม่ต้องพึ่ง HTTP round-trip ผ่าน browser ของลูกค้าอีกต่อไป

import fs from "fs";
import path from "path";
import axios from "axios";

const WEBHOOK_FILE = path.join(process.cwd(), "data", "webhook.json");

function formatMention(discordId) {
  if (!discordId) return null;
  return `<@${discordId}>`;
}

function formatRoleMentions(roleIds) {
  if (!roleIds || roleIds.length === 0) return null;
  return roleIds.map((id) => `<@&${id}>`).join(", ");
}

function readWebhookConfig() {
  try {
    return JSON.parse(fs.readFileSync(WEBHOOK_FILE, "utf-8"));
  } catch {
    return { enabled: false, webhooks: {} };
  }
}

/**
 * แจ้งเตือน Discord เมื่อมีการซื้อสินค้าสำเร็จ (เรียกจากฝั่งเซิร์ฟเวอร์เท่านั้น)
 */
export async function notifyPurchase({ discordId, userName, productName, version, price, roleIds }) {
  const config = readWebhookConfig();
  if (!config.enabled) return;

  const eventWebhook = config.webhooks?.purchase;
  if (!eventWebhook?.enabled || !eventWebhook?.url) {
    console.log("⏭️ Purchase webhook skipped (not configured or disabled)");
    return;
  }

  const fields = [
    { name: "📦 สินค้า", value: `**${productName}**`, inline: true },
    { name: "💰 ราคา", value: `**${Number(price).toLocaleString()}** Point`, inline: true },
  ];
  if (version) fields.push({ name: "📌 เวอร์ชัน", value: `v${version}`, inline: true });
  const roleMentions = formatRoleMentions(roleIds);
  if (roleMentions) fields.push({ name: "🎭 Role ที่ได้รับ", value: roleMentions, inline: false });

  let description = `${userName} ซื้อ "${productName}" สำเร็จ`;
  if (discordId) description += `\n\n👤 **ผู้ใช้:** ${formatMention(discordId)}`;

  const embed = {
    author: {
      name: "xCloud Studio",
      icon_url: "https://cdn-icons-png.flaticon.com/512/5968/5968853.png",
    },
    title: "🛒 ซื้อสินค้าสำเร็จ",
    description,
    color: 0xf59e0b,
    timestamp: new Date().toISOString(),
    footer: { text: `👤 ${userName}` },
    fields,
  };

  await axios.post(eventWebhook.url, {
    embeds: [embed],
    content: discordId ? formatMention(discordId) : undefined,
    allowed_mentions: discordId ? { users: [discordId] } : undefined,
  });

  console.log("✅ Purchase webhook sent to Discord");
}