// pages/api/topups.js
import { connectToDB } from "@/utils/db";
import TopupHistory from "@/models/TopupHistory";

export default async function handler(req, res) {
  const { discordId } = req.query;
  if (!discordId) return res.status(400).json({ error: "ต้องระบุ discordId" });

  try {
    await connectToDB();
    const data = await TopupHistory.find({ userId: discordId }).sort({ createdAt: -1 });
    return res.status(200).json(data);
  } catch (err) {
    console.error("Topup Fetch Error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
}
