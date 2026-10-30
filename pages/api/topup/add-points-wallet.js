// pages/api/topup/add-points-wallet.js
//
// ⚠️ เดิม: browser แลกอังเปาเอง แล้วส่ง { userId, amount, voucherCode } มาให้เซิร์ฟเวอร์เชื่อ
//    → ใครก็ยิง POST ใส่ amount เท่าไรก็ได้ ได้แต้มฟรีทันที
// ✅ ใหม่: เซิร์ฟเวอร์เป็นคนแลกอังเปาเอง ใช้จำนวนเงินจากผลการแลกจริงเท่านั้น
//    และเติมแต้มให้ "คนที่ล็อกอินอยู่" เท่านั้น
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import TopupHistory from "@/models/TopupHistory";
import { requireUser } from "@/utils/checkAdmin";
import { sameOrigin, rateLimit } from "@/utils/apiGuard";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const RECEIVER_MOBILE = process.env.TRUEWALLET_MOBILE || "0800451901";
const REDEEM_API = process.env.TRUEWALLET_REDEEM_API || "https://tw.oiioioiiioooioio.de/api";

const ERROR_MESSAGES = {
  TARGET_USER_REDEEMED: "คุณรับอังเปานี้ไปแล้ว",
  VOUCHER_OUT_OF_STOCK: "มีคนรับอังเปานี้ไปแล้ว",
  VOUCHER_EXPIRED: "อังเปาหมดอายุแล้ว",
  VOUCHER_NOT_FOUND: "ไม่พบอังเปาในระบบ",
  CANNOT_GET_OWN_VOUCHER: "ไม่สามารถรับอังเปาของตัวเองได้",
  TARGET_USER_NOT_FOUND: "ไม่พบเบอร์ผู้รับในระบบ",
};

async function notifyDiscord(title, description, color = 65280) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ title, description, color, timestamp: new Date().toISOString() }],
        allowed_mentions: { parse: [] },
      }),
    });
  } catch (err) {
    console.error("Discord notify error:", err.message);
  }
}

async function redeemVoucher(code) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(`${REDEEM_API}/${encodeURIComponent(code)}/${RECEIVER_MOBILE}`, {
      method: "POST",
      signal: controller.signal,
    });
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sameOrigin(req, res)) return;

  const me = await requireUser(req, res);
  if (!me) return;
  if (!rateLimit(req, res, { key: "wallet", limit: 5, id: me.userId })) return;

  const userId = me.userId;
  const userName = me.session.user.name || "Unknown User";
  const { voucherCode } = req.body || {};

  if (typeof voucherCode !== "string" || !/^[a-zA-Z0-9]{10,64}$/.test(voucherCode)) {
    return res.status(400).json({ success: false, message: "รหัสอังเปาไม่ถูกต้อง" });
  }

  try {
    await connectToDB();

    const duplicate = await TopupHistory.findOne({ voucherCode, method: "wallet", status: "success" });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "รหัสอังเปานี้ถูกใช้ไปแล้ว" });
    }

    let redeem;
    try {
      redeem = await redeemVoucher(voucherCode);
    } catch (err) {
      console.error("Voucher redeem error:", err.message);
      return res.status(502).json({ success: false, message: "เชื่อมต่อระบบ TrueWallet ไม่สำเร็จ" });
    }

    if (redeem?.status?.code !== "SUCCESS") {
      const code = redeem?.status?.code;
      return res.status(400).json({
        success: false,
        code,
        message: ERROR_MESSAGES[code] || redeem?.status?.message || "การรับเงินล้มเหลว",
      });
    }

    const amount = parseFloat(redeem?.data?.my_ticket?.amount_baht);
    if (!Number.isFinite(amount) || amount <= 0) {
      await notifyDiscord("⚠️ แลกอังเปาสำเร็จแต่อ่านจำนวนเงินไม่ได้", `👤 ${userName} (${userId})\n🎫 ${voucherCode}`, 16776960);
      return res.status(500).json({ success: false, message: "รับเงินแล้วแต่อ่านจำนวนไม่ได้ กรุณาแจ้งแอดมิน" });
    }

    const pointsToAdd = Math.floor(amount);
    const updated = await User.findOneAndUpdate(
      { discordId: userId },
      { $inc: { points: pointsToAdd }, $setOnInsert: { name: userName } },
      { new: true, upsert: true }
    );

    await TopupHistory.create({
      userId,
      userName,
      amount,
      points: pointsToAdd,
      method: "wallet",
      voucherCode,
      provider: "truemoney-api",
      status: "success",
    });

    await notifyDiscord(
      "✅ เติมเงินผ่าน TrueWallet สำเร็จ",
      `👤 ${userName} (${userId})\n💰 จำนวน: ${amount.toLocaleString()} บาท\n⭐ แต้มที่ได้รับ: ${pointsToAdd}\n🎫 รหัสอังเปา: ${voucherCode}`
    );

    return res.status(200).json({
      success: true,
      message: `เพิ่มแต้มสำเร็จ ${pointsToAdd} พ้อยท์`,
      data: {
        oldPoints: updated.points - pointsToAdd,
        addedPoints: pointsToAdd,
        newPoints: updated.points,
        amount,
      },
    });
  } catch (error) {
    console.error("Add points wallet error:", error);
    await notifyDiscord("❌ เติมเงิน TrueWallet ล้มเหลว", `👤 ${userName} (${userId})\n🎫 ${voucherCode}\n❌ ${error.message}`, 16711680);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเพิ่มแต้ม กรุณาแจ้งแอดมิน" });
  }
}
