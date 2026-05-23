import { connectToDB } from "../../../utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
  await connectToDB();

  if (req.method === "GET") {
    try {
      const users = await User.find({}, { 
        discordId: 1, 
        name: 1, 
        email: 1, 
        points: 1,
        products: 1 
      });
      
      // แปลงเป็นรูปแบบที่หน้าบ้านใช้
      const formattedUsers = users.map(user => ({
        id: user.discordId,
        name: user.name,
        email: user.email,
        points: user.points || 0,
        products: user.products || []
      }));
      
      console.log(`✅ Fetched ${formattedUsers.length} users`);
      return res.status(200).json(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "Failed to fetch users: " + error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}