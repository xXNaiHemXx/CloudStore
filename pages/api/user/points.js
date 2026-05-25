import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  //  必须是 PUT 方法
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    
    const { userId, points } = req.body;

    console.log("📌 Update points request:", { userId, points });

    if (!userId || points === undefined) {
      return res.status(400).json({ error: "Missing userId or points" });
    }

    // 查找用户
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPoints = user.points;
    user.points = Number(points);
    await user.save();

    console.log(`✅ Updated points for ${user.name}: ${oldPoints} -> ${user.points}`);

    return res.status(200).json({ 
      success: true, 
      message: "Points updated successfully",
      points: user.points 
    });
  } catch (error) {
    console.error("Error updating points:", error);
    return res.status(500).json({ error: "Failed to update points: " + error.message });
  }
}