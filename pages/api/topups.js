// pages/api/topups.js
import { connectToDB } from "@/utils/db";
import TopupHistory from "@/models/TopupHistory";
import { requireUser } from "@/utils/checkAdmin";

export default async function handler(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  const discordId = me.userId; // ดูได้เฉพาะประวัติของตัวเอง

  try {
    await connectToDB();
    const data = await TopupHistory.find({ userId: discordId }).sort({ createdAt: -1 });
    return res.status(200).json(data);
  } catch (err) {
    console.error("Topup Fetch Error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
}
