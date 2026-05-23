import { connectToDB } from "../../../utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    await connectToDB();

    const user = await User.findById(userId).lean();

    if (!user || !user.products) {
      return res.status(200).json([]);
    }

    // ✅ ส่งกลับ array ข้อมูลสินค้า (ที่อยู่ใน user.products)
    return res.status(200).json(user.products);
  } catch (err) {
    console.error("Error in fetch-products:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
