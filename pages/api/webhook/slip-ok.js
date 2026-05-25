// /pages/api/webhook/slip-ok.js
import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Slip from "@/models/Slip"; // โมเดลไว้เก็บ ref_code ที่ใช้แล้ว

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { data } = req.body;

  // ตรวจสอบข้อมูลหลัก
  const { ref_code, amount, account_number, account_name, datetime, webhook_custom } = data;
  const userId = webhook_custom; // เราส่ง userId ติดไปกับการอัปโหลด

  if (!ref_code || !userId || !amount) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  await connectToDB();

  // ❌ ตรวจสอบว่าสลิปนี้เคยใช้แล้ว
  const isUsed = await Slip.findOne({ ref_code });
  if (isUsed) {
    return res.status(409).json({ error: "สลิปนี้ถูกใช้ไปแล้ว" });
  }

  //  บันทึกว่าใช้สลิปนี้แล้ว
  await Slip.create({ ref_code, userId });

  //  เพิ่ม point ให้ user
  const updated = await User.findOneAndUpdate(
    { discordId: userId },
    { $inc: { points: parseFloat(amount) } },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  }

  return res.status(200).json({
    message: "เติมเงินสำเร็จ",
    userId,
    ref_code,
    amount,
    newPoints: updated.points,
  });
}
