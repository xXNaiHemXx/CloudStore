import { connectToDB } from "../../utils/db";
import Item from "../../models/items"; // ✅ ตรวจสอบว่าชื่อโมเดลถูกต้อง (ควรเป็น Item ไม่ใช่ items)

export default async function handler(req, res) {
  await connectToDB(); // ✅ เชื่อมต่อกับฐานข้อมูล

  switch (req.method) {
    case "GET":
      try {
        
        const { id } = req.query;
        if (id) {
          // ✅ ถ้ามี `id` ให้ดึงสินค้าเฉพาะตัว
          const item = await Item.findById(id);
          if (!item) return res.status(404).json({ error: "Item not found" });
          return res.status(200).json(item);
        }
        // ✅ ถ้าไม่มี `id` ให้ดึงสินค้าทั้งหมด
        const items = await Item.find({});
        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ error: "Failed to fetch items" });
      }
      break;

      case "POST":
      try {
        console.log("✅ Received Data from Frontend:", req.body); // ✅ Debug ข้อมูลที่รับจาก Frontend

        const { itemsname, itemsprice, itemsimage, itemsimages, itemsdesc, itemsurlyoutube, itemstitle, itemsfile, itemsversion } = req.body;

        if (!itemsname || !itemsprice || !itemsimage || !itemsdesc || !itemstitle || !itemsfile || !itemsversion) {
          return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
        }

        const formattedImages = Array.isArray(itemsimages) ? itemsimages : [];
        const formattedurl = itemsurlyoutube && typeof itemsurlyoutube === "string" ? itemsurlyoutube : "";


        const newItem = new Item({
          itemsname,
          itemsprice,
          itemsimage,
          itemsimages: formattedImages,
          itemsurlyoutube: formattedurl,
          itemsdesc,
          itemstitle,
          itemsfile,
          itemsversion,
        });

        await newItem.save({ new: true });
        console.log("✅ Saved Item to MongoDB:", newItem); // ✅ Debug ข้อมูลที่ถูกบันทึก

        res.status(201).json(newItem);
      } catch (error) {
        console.error("❌ Error adding item:", error);
        res.status(500).json({ error: "Failed to add item" });
      }
      break;


      
      

    case "PUT":
      try {
        const { id, itemsname, itemsprice, itemsimage, itemsimages, itemsurlyoutube, itemsdesc, itemstitle, itemsfile, itemsversion } = req.body;
        if (!id) return res.status(400).json({ error: "Missing item ID" });

        const updatedItem = await Item.findByIdAndUpdate(id, {
          itemsname,
          itemsprice,
          itemsimage,
          itemsimages: itemsimages || [],
          itemsurlyoutube,
          itemsdesc,
          itemstitle,
          itemsfile,
          itemsversion,
        }, { new: true });

        if (!updatedItem) return res.status(404).json({ error: "Item not found" });

        res.status(200).json({ message: "Item updated successfully", item: updatedItem });
      } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: "Failed to update item" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Missing item ID" });

        const deletedItem = await Item.findByIdAndDelete(id);
        if (!deletedItem) return res.status(404).json({ error: "Item not found" });

        res.status(200).json({ message: "Item deleted successfully" });
      } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Failed to delete item" });
      }
      break;

    default:
      res.status(405).json({ error: "Method Not Allowed" });
      break;
  }
}
