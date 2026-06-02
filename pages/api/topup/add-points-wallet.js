// pages/api/topup/add-points-wallet.js
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import TopupHistory from "@/models/TopupHistory";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function notifyDiscord(title, description, color = 65280, fields = []) {
  try {
    const embed = { title, description, color, timestamp: new Date().toISOString() };
    if (fields.length) embed.fields = fields;
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.error("Discord notify error:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, userName, amount, voucherCode, provider } = req.body;

  if (!userId || !amount || !voucherCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await connectToDB();

    // ค้นหาผู้ใช้
    let user = await User.findOne({ discordId: userId });
    
    if (!user) {
      user = new User({
        discordId: userId,
        name: userName || "Unknown User",
        points: 0
      });
      await user.save();
    }

    const pointsToAdd = parseInt(amount);
    const oldPoints = user.points || 0;
    const newPoints = oldPoints + pointsToAdd;

    // ตรวจสอบรหัสอังเปาซ้ำ
    const duplicate = await TopupHistory.findOne({ 
      voucherCode: voucherCode,
      method: "wallet",
      status: "success"
    });
    
    if (duplicate) {
      await notifyDiscord(
        "❌ รหัสอังเปาซ้ำ",
        `👤 ${userName || user.name} (${userId})\n🎫 รหัส: ${voucherCode}`,
        16711680
      );
      return res.status(409).json({ error: "รหัสอังเปานี้ถูกใช้ไปแล้ว" });
    }

    // อัปเดตแต้มผู้ใช้
    user.points = newPoints;
    await user.save();

    // บันทึกประวัติ
    await TopupHistory.create({
      userId: userId,
      userName: userName || user.name,
      amount: amount,
      points: pointsToAdd,
      method: "wallet",
      voucherCode: voucherCode,
      provider: provider || "unknown",
      status: "success"
    });

    // แจ้งเตือน Discord
    await notifyDiscord(
      "✅ เติมเงินผ่าน TrueWallet สำเร็จ",
      `👤 ${userName || user.name}\n💰 จำนวน: ${amount.toLocaleString()} บาท\n⭐ แต้มที่ได้รับ: ${pointsToAdd} พ้อยท์\n🎫 รหัสอังเปา: ${voucherCode}\n🔌 Provider: ${provider || "unknown"}`,
      65280
    );

    return res.status(200).json({
      success: true,
      message: `เพิ่มแต้มสำเร็จ ${pointsToAdd} พ้อยท์`,
      data: {
        oldPoints,
        addedPoints: pointsToAdd,
        newPoints,
        amount: amount
      }
    });

  } catch (error) {
    console.error("Add points wallet error:", error);
    
    // บันทึก error
    try {
      await TopupHistory.create({
        userId: userId,
        userName: userName || "Unknown",
        amount: amount,
        points: 0,
        method: "wallet",
        voucherCode: voucherCode,
        provider: provider || "unknown",
        status: "error",
        errorDetail: error.message
      });
    } catch (logError) {
      console.error("Failed to save error log:", logError);
    }

    await notifyDiscord(
      "❌ เติมเงิน TrueWallet ล้มเหลว",
      `👤 ${userName || userId}\n🎫 รหัส: ${voucherCode}\n❌ Error: ${error.message}`,
      16711680
    );

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มแต้ม",
      error: error.message
    });
  }
}