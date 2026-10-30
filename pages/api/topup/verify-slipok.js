import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import SlipLog from "@/models/SlipLog";
import TopupHistory from "@/models/TopupHistory";
import { requireUser } from "@/utils/checkAdmin";
import { sameOrigin, rateLimit } from "@/utils/apiGuard";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BASE_URL = process.env.BASE_URL;

const EXPECTED_ACCOUNT_NAMES = ["อิบรอเหม", "Ibrohem", "อุสมา", "Usama"];

function isNameMatch(receivedName) {
  if (!receivedName) return false;
  const lowerName = receivedName.toLowerCase();
  return EXPECTED_ACCOUNT_NAMES.some(name => 
    lowerName.includes(name.toLowerCase())
  );
}

async function notifyDiscord(title, description, color = 16776960, imageUrl = null) {
  try {
    const embed = { title, description, color, timestamp: new Date().toISOString() };
    if (imageUrl) embed.image = { url: imageUrl };
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.error("❗ ไม่สามารถแจ้งเตือน Discord ได้:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOrigin(req, res)) return;

  // ✅ เติมแต้มให้คนที่ล็อกอินอยู่เท่านั้น (เดิมรับ userId จาก body)
  const me = await requireUser(req, res);
  if (!me) return;
  if (!rateLimit(req, res, { key: "slip-verify", limit: 10, id: me.userId })) return;
  const userId = me.userId;

  const { fileUrl } = req.body || {}; // ✅ ไม่รับ amount แล้ว

  // ✅ รับเฉพาะไฟล์ที่ upload-slip สร้างขึ้นเท่านั้น (กัน path traversal เช่น /slip/../../.env.local)
  if (typeof fileUrl !== "string" || !/^\/slip\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(fileUrl)) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  const safeFileUrl = fileUrl;
  const imagePath = path.join(process.cwd(), "public", "slip", path.basename(fileUrl));
  const imageUrl = `${BASE_URL}${safeFileUrl}`;

  if (!fs.existsSync(imagePath)) {
    await notifyDiscord("❌ ไม่พบไฟล์สลิป", `Path: ${imagePath}`, 16711680, imageUrl);
    await connectToDB();
    await TopupHistory.create({ userId, amount: 0, status: "error", slipUrl: imageUrl });
    return res.status(404).json({ error: "ไม่พบไฟล์สลิป" });
  }

  try {
    const form = new FormData();
    form.append("files", fs.createReadStream(imagePath));
    form.append("log", "true");
    // ✅ ไม่ต้องส่ง amount ให้ SlipOK → SlipOK จะ detect เอง

    const slipRes = await fetch(
      `https://api.slipok.com/api/line/apikey/${process.env.SLIPOK_BRANCH_ID}`,
      {
        method: "POST",
        headers: {
          "x-authorization": process.env.SLIPOK_API_KEY,
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    const slipData = await slipRes.json();
    console.log("📌 SlipOK Response:", JSON.stringify(slipData, null, 2));

    if (!slipData?.data?.transRef) {
      await notifyDiscord("❌ ตรวจสอบสลิปล้มเหลว", slipData?.message || "ไม่สามารถตรวจสอบสลิปได้", 16711680, imageUrl);
      await connectToDB();
      await TopupHistory.create({ userId, amount: 0, status: "error", slipUrl: imageUrl });
      return res.status(400).json({ error: slipData?.message || "ไม่สามารถตรวจสอบสลิปได้" });
    }

    const { transRef, amount: slipAmount, receiver } = slipData.data;
    
    // ✅ ใช้จำนวนเงินจากสลิปเท่านั้น
    const finalAmount = parseFloat(slipAmount) || 0;

    if (finalAmount <= 0) {
      await notifyDiscord("❌ ตรวจไม่พบจำนวนเงิน", `Ref: ${transRef}`, 16711680, imageUrl);
      await connectToDB();
      await TopupHistory.create({ userId, amount: 0, status: "error", transRef, slipUrl: imageUrl });
      return res.status(400).json({ error: "ไม่พบจำนวนเงินในสลิป" });
    }

    console.log(`📌 จำนวนเงินจากสลิป: ${finalAmount} บาท`);

    // ตรวจสอบชื่อผู้รับ
    let receiverName = receiver?.displayName || receiver?.name || "";
    
    if (receiverName && !isNameMatch(receiverName)) {
      await notifyDiscord(
        "⚠️ ชื่อบัญชีผู้รับไม่ตรง",
        `คาดว่า: ${EXPECTED_ACCOUNT_NAMES.join(", ")}\nรับได้: ${receiverName || "ไม่พบข้อมูล"}`,
        16776960, imageUrl
      );
      await connectToDB();
      await TopupHistory.create({ userId, amount: finalAmount, status: "error", transRef, slipUrl: imageUrl, errorDetail: `ชื่อไม่ตรง: ${receiverName}` });
      return res.status(400).json({ error: `ชื่อบัญชีผู้รับไม่ตรง: "${receiverName}"` });
    }

    // ตรวจสอบสลิปซ้ำ
    await connectToDB();

    const duplicate = await SlipLog.findOne({ transRef });
    if (duplicate) {
      const user = await User.findOne({ discordId: userId });
      const username = user?.name || user?.username || "ไม่ทราบชื่อผู้ใช้";
      await notifyDiscord("❌ สลิปซ้ำ", `👤 ${username} (${userId})\n🔁 Ref: ${transRef}`, 16711680, imageUrl);
      await TopupHistory.create({ userId, amount: finalAmount, status: "duplicate", transRef, slipUrl: imageUrl });
      return res.status(409).json({ error: "สลิปนี้ถูกใช้งานไปแล้ว" });
    }

    try {
      await SlipLog.create({ transRef, userId });
    } catch (e) {
      // unique index ของ transRef กันกรณียิงสลิปเดียวกันพร้อมกันหลาย request
      if (e?.code === 11000) return res.status(409).json({ error: "สลิปนี้ถูกใช้งานไปแล้ว" });
      throw e;
    }

    // ✅ เติมเงินตามจำนวนในสลิป
    const updated = await User.findOneAndUpdate(
      { discordId: userId },
      { $inc: { points: finalAmount } },
      { new: true }
    );

    if (!updated) {
      await notifyDiscord("❌ ไม่พบผู้ใช้", `User ID: ${userId}`, 16711680, imageUrl);
      await TopupHistory.create({ userId, amount: finalAmount, status: "error", transRef, slipUrl: imageUrl });
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    await notifyDiscord(
      "✅ เติมเงินสำเร็จ",
      `👤 ${userId}\n💰 จำนวน: ${finalAmount.toLocaleString()} บาท\n🎯 พ้อยท์ใหม่: ${updated.points.toLocaleString()}\n🔁 Ref: ${transRef}`,
      65280, imageUrl
    );

    await TopupHistory.create({ userId, amount: finalAmount, status: "success", transRef, slipUrl: imageUrl });

    return res.status(200).json({
      success: true,
      message: `เติมเงินสำเร็จ ${finalAmount.toLocaleString()} บาท`,
      amount: finalAmount,
      newPoints: updated.points,
    });
  } catch (err) {
    console.error("🔥 เกิดข้อผิดพลาด:", err);
    await connectToDB();
    await TopupHistory.create({ userId, amount: 0, status: "error", slipUrl: imageUrl });
    await notifyDiscord("🔥 เกิดข้อผิดพลาดในระบบ", err.message, 16711680, imageUrl);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ" });
  }
}