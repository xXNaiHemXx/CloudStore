import { connectToDB } from "../../../utils/db";
import User from "@/models/User"; // สมมุติว่าคุณมี model User แล้ว

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, points } = req.body;

  if (!userId || typeof points !== "number") {
    return res.status(400).json({ message: "Missing or invalid data" });
  }

  try {
    await connectToDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { points },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้นี้" });
    }

    return res.status(200).json({ message: "อัปเดตแต้มสำเร็จ", user });
  } catch (err) {
    console.error("[UPDATE POINT ERROR]", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
}
