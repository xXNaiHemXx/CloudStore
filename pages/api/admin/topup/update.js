import { connectToDB } from "@/utils/db";
import Topup from "@/models/Topup";
import User from "@/models/User";
import { requireAdmin } from "@/utils/checkAdmin";
import { sameOrigin } from "@/utils/apiGuard";

export default async function handler(req, res) {

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOrigin(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth.isAdmin) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    await connectToDB();

    const { topupId, status } = req.body || {};
    const approvedBy = auth.userId;

    if (!topupId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const topup = await Topup.findById(topupId);
    if (!topup) {
      return res.status(404).json({ error: "Topup not found" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    // กันอนุมัติซ้ำ (เดิมกด approve ซ้ำได้แต้มซ้ำ)
    if (topup.status === "approved") {
      return res.status(409).json({ error: "รายการนี้อนุมัติไปแล้ว" });
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