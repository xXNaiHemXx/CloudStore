import { connectToDB } from "@/utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
  await connectToDB();

  if (req.method === "GET") {
    try {
      const users = await User.find({}, "name email points purchases");
      const result = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points || 0,
        totalPurchases: user.purchases?.length || 0,
      }));
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
