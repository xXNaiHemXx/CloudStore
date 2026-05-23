// utils/sendDiscord.js
import fetch from "node-fetch";

export async function sendDiscordTopupNotification({ username, amount, transRef, imageUrl }) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.warn("❌ ไม่พบ DISCORD_WEBHOOK_URL ใน .env");
    return;
  }

  const embed = {
    title: "💸 มีการเติมเงินเข้าระบบ",
    color: 0x00cc99,
    fields: [
      { name: "👤 ผู้ใช้", value: username, inline: true },
      { name: "💰 จำนวนเงิน", value: `${amount} บาท`, inline: true },
      { name: "🧾 อ้างอิงสลิป", value: transRef || "-" },
    ],
    timestamp: new Date().toISOString(),
  };

  if (imageUrl) {
    embed.image = { url: imageUrl };
  }

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log("📨 ส่งแจ้งเตือน Discord แล้ว");
  } catch (err) {
    console.error("❌ ส่งแจ้งเตือนไปยัง Discord ล้มเหลว:", err);
  }
}
