import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import { getSessionUserId, getAdminRole } from "@/utils/checkAdmin";

export default async function handler(req, res) {
  //  必须是 GET 方法
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    
    const { userId } = req.query;

    // ดูได้เฉพาะของตัวเอง หรือเป็นแอดมิน
    const me = await getSessionUserId(req, res);
    if (!me.userId) return res.status(401).json({ error: "Unauthorized" });
    if (String(userId) !== me.userId && !(await getAdminRole(me.userId))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    console.log("📌 Fetch products for userId:", userId);
    
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const user = await User.findOne({ discordId: userId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`✅ Found ${user.products?.length || 0} products for ${user.name}`);
    return res.status(200).json(user.products || []);
  } catch (error) {
    console.error("Error fetching user products:", error);
    return res.status(500).json({ error: "Failed to fetch products: " + error.message });
  }
}