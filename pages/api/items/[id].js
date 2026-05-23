import { connectToDB } from "../../../utils/db";
import Item from "../../../models/items";

export default async function handler(req, res) {
  await connectToDB();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
  }
}