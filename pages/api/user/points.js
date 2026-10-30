import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import { requireAdmin } from "@/utils/checkAdmin";
import { sameOrigin, isDiscordId, serverError } from "@/utils/apiGuard";
import { writeLogDirect } from "@/utils/serverLogWriter";

// ⚠️ เดิม endpoint นี้ไม่มีการตรวจสิทธิ์เลย ใครก็ยิง PUT ตั้งแต้มให้ใครก็ได้
// ตอนนี้แก้แต้มได้เฉพาะแอดมิน และบันทึกทุกครั้งว่าใครแก้
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

    const { userId, points } = req.body || {};
    const newPoints = Number(points);

    if (!isDiscordId(String(userId)) || !Number.isFinite(newPoints) || newPoints < 0 || newPoints > 10_000_000) {
      return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    }

    const user = await User.findOne({ discordId: String(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPoints = user.points;
    user.points = Math.floor(newPoints);
    await user.save();

    console.warn(`💎 [POINTS EDIT] ${user.discordId}: ${oldPoints} -> ${user.points} by admin ${auth.userId}`);
    await writeLogDirect("user_edit", "แก้ไขแต้ม", `${auth.session.user.name} แก้แต้ม ${user.name}: ${oldPoints} → ${user.points}`, auth.session.user.name, {
      discordId: user.discordId, oldPoints, newPoints: user.points, by: auth.userId,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Points updated successfully",
      points: user.points
    });
  } catch (error) {
    return serverError(res, error, "user/points");
  }
}
