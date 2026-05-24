import { connectToDB } from "@/utils/db";
import Topup from "@/models/Topup";
import User from "@/models/User";

export default async function handler(req, res) {

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    const { topupId, status, approvedBy } = req.body;

    if (!topupId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const topup = await Topup.findById(topupId);
    if (!topup) {
      return res.status(404).json({ error: "Topup not found" });
    }

    topup.status = status;
    topup.approvedBy = approvedBy;
    topup.approvedAt = new Date();

    // ถ้า approve ให้เพิ่มแต้มให้ผู้ใช้
    if (status === "approved") {
      const user = await User.findOne({ discordId: topup.userId });
      if (user) {
        user.points = (user.points || 0) + topup.points;
        await user.save();
      }
    }

    await topup.save();

    return res.status(200).json({
      success: true,
      message: `Topup ${status} successfully`,
      topup
    });

  } catch (error) {
    console.error("Error updating topup:", error);
    return res.status(500).json({ error: error.message });
  }

}