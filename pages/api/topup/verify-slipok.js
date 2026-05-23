import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import SlipLog from "@/models/SlipLog";
import TopupHistory from "@/models/TopupHistory";

// ===== Discord แจ้งเตือน =====
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BASE_URL = process.env.BASE_URL;

async function notifyDiscord(title, description, color = 16776960, imageUrl = null) {
  try {
    const embed = {
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
    };
    if (imageUrl) {
      embed.image = { url: imageUrl };
    }
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

  const { fileUrl, amount, userId } = req.body;
  console.log("📥 ข้อมูลที่รับมา:", { fileUrl, amount, userId });

  if (!fileUrl || !amount || !userId) {
    await notifyDiscord("❌ ข้อมูลไม่ครบ", `fileUrl: ${fileUrl}\namount: ${amount}\nuserId: ${userId}`, 16711680);
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  const safeFileUrl = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  const imagePath = path.join(process.cwd(), "public", safeFileUrl.replace("/slip/", "slip/"));
  const imageUrl = `${BASE_URL}${safeFileUrl}`;

  if (!fs.existsSync(imagePath)) {
    await notifyDiscord("❌ ไม่พบไฟล์สลิป", `Path: ${imagePath}`, 16711680, imageUrl);

    await connectToDB();
    await TopupHistory.create({
      userId,
      amount: parseFloat(amount),
      status: "error",
      slipUrl: imageUrl,
    });

    return res.status(404).json({ error: "ไม่พบไฟล์สลิป" });
  }

  try {
    const form = new FormData();
    form.append("files", fs.createReadStream(imagePath));
    form.append("log", "true");
    form.append("amount", amount);

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

    if (!slipRes.ok || !slipData?.data?.transRef) {
      await notifyDiscord("❌ ตรวจสอบสลิปล้มเหลว", slipData?.message || "ไม่สามารถตรวจสอบสลิปได้", 16711680, imageUrl);

      await connectToDB();
      await TopupHistory.create({
        userId,
        amount: parseFloat(amount),
        status: "error",
        slipUrl: imageUrl,
      });

      return res.status(400).json({ error: slipData?.message || "ไม่สามารถตรวจสอบสลิปได้" });
    }

    const { transRef, amount: slipAmount } = slipData.data;

    await connectToDB();

    const duplicate = await SlipLog.findOne({ transRef });
    if (duplicate) {
      const user = await User.findOne({ discordId: userId });
      const username = user?.username || "ไม่ทราบชื่อผู้ใช้";

      await notifyDiscord(
        "❌ สลิปซ้ำ",
        `👤 ผู้ใช้: ${username} (${userId})\n🔁 Ref: ${transRef}`,
        16711680,
        imageUrl
      );

      await TopupHistory.create({
        userId,
        amount: parseFloat(amount),
        status: "duplicate",
        transRef,
        slipUrl: imageUrl,
      });

      return res.status(409).json({ error: "สลิปนี้ถูกใช้งานไปแล้ว" });
    }


    await SlipLog.create({ transRef, userId });

    const updated = await User.findOneAndUpdate(
      { discordId: userId },
      { $inc: { points: parseFloat(slipAmount) } },
      { new: true }
    );

    if (!updated) {
      await notifyDiscord("❌ ไม่พบผู้ใช้", `User ID: ${userId}`, 16711680, imageUrl);

      await TopupHistory.create({
        userId,
        amount: parseFloat(slipAmount),
        status: "error",
        transRef,
        slipUrl: imageUrl,
      });

      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    await notifyDiscord(
      "✅ เติมเงินสำเร็จ",
      `👤 ผู้ใช้: ${userId}\n💰 จำนวน: ${slipAmount} บาท\n🎯 พ้อยท์ใหม่: ${updated.points}\n🔁 Ref: ${transRef}`,
      65280,
      imageUrl
    );

    await TopupHistory.create({
      userId,
      amount: parseFloat(slipAmount),
      status: "success",
      transRef,
      slipUrl: imageUrl,
    });

    return res.status(200).json({
      message: "เติมเงินสำเร็จ",
      amount: slipAmount,
      newPoints: updated.points,
    });
  } catch (err) {
    console.error("🔥 เกิดข้อผิดพลาดระหว่างตรวจสอบสลิป:", err);

    await connectToDB();
    await TopupHistory.create({
      userId,
      amount: parseFloat(amount),
      status: "error",
      slipUrl: imageUrl,
    });

    await notifyDiscord("🔥 เกิดข้อผิดพลาดในระบบ", err.message, 16711680, imageUrl);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ" });
  }
}
