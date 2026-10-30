// /pages/api/webhook/slip-ok.js
//
// ⚠️ เดิม endpoint นี้ไม่มีการยืนยันตัวตนเลย ใครก็ POST { data: { ref_code, amount, webhook_custom } }
//    แล้วได้แต้มฟรีเท่าไรก็ได้ — ตอนนี้ปิดไว้ เว้นแต่ตั้ง SLIPOK_WEBHOOK_SECRET และผู้เรียกส่ง
//    header "x-webhook-secret" ที่ตรงกันมาด้วย (ระบบเติมเงินปัจจุบันใช้ /api/topup/verify-slipok แทนแล้ว)
import crypto from "crypto";
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Slip from "@/models/Slip";

function secretMatches(provided) {
  const expected = process.env.SLIPOK_WEBHOOK_SECRET;
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!secretMatches(req.headers["x-webhook-secret"])) {
    console.warn("🚫 [slip-ok webhook] rejected request without valid secret");
    return res.status(404).end();
  }

  const data = req.body?.data || {};
  const { ref_code, amount, webhook_custom } = data;
  const userId = webhook_custom;
  const value = parseFloat(amount);

  if (typeof ref_code !== "string" || typeof userId !== "string" || !Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  await connectToDB();

  try {
    await Slip.create({ ref_code, userId });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "สลิปนี้ถูกใช้ไปแล้ว" });
    throw e;
  }

  const updated = await User.findOneAndUpdate(
    { discordId: userId },
    { $inc: { points: value } },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  }

  return res.status(200).json({ message: "เติมเงินสำเร็จ" });
}
