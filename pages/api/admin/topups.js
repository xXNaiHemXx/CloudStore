import { connectToDB } from "@/utils/db";
import TopupHistory from "@/models/TopupHistory";
import User from "@/models/User";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    //  ดึงประวัติการเติมเงินทั้งหมด เรียงตามล่าสุด
    const topups = await TopupHistory.find({})
      .sort({ createdAt: -1 });

    //  ดึงข้อมูลผู้ใช้เพิ่มเติมสำหรับแต่ละรายการ
    const topupsWithUser = await Promise.all(
      topups.map(async (topup) => {
        const user = await User.findOne({ discordId: topup.userId });
        return {
          _id: topup._id,
          userId: topup.userId,
          userName: user?.name || topup.userName || "Unknown",
          amount: topup.amount,
          status: topup.status,
          transRef: topup.transRef,
          slipUrl: topup.slipUrl,
          createdAt: topup.createdAt,
          updatedAt: topup.updatedAt
        };
      })
    );

    return res.status(200).json(topupsWithUser);

  } catch (error) {
    console.error("Error fetching topups:", error);
    return res.status(500).json({ error: error.message });
  }

}