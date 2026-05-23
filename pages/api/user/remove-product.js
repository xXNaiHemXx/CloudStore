import { connectToDB } from "../../../utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();

    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ เปรียบเทียบแบบ string เพื่อให้ ObjectId เทียบได้
    user.products = user.products.filter(
      (p) => p.productId.toString() !== productId.toString()
    );

    user.markModified("products");
    await user.save();

    res.status(200).json({ success: true, message: "ลบสินค้าออกจากบัญชีผู้ใช้แล้ว" });
  } catch (err) {
    console.error("❌ Error removing product:", err);
    res.status(500).json({ error: "Server error" });
  }
}
