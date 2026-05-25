import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  //  必须是 GET 方法
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    
    const { userId } = req.query;
    
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