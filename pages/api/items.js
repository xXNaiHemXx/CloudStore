import { connectToDB } from "../../utils/db";
import Item from "../../models/items";

export default async function handler(req, res) {
  await connectToDB();

  switch (req.method) {
    case "GET":
      try {
        const { id } = req.query;
        if (id) {
          const item = await Item.findById(id);
          if (!item) return res.status(404).json({ error: "Item not found" });
          return res.status(200).json(item);
        }
        const items = await Item.find({});
        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ error: "Failed to fetch items" });
      }
      break;

    case "POST":
      try {
        console.log("✅ Received Data from Frontend:", req.body);

        const { 
          itemsname, itemsprice, itemsimage, itemsimages, 
          itemsdesc, itemsurlyoutube, itemstitle, itemsfile, 
          itemsversion, discordRoleIds
        } = req.body;

        if (!itemsname || !itemsprice || !itemsimage || !itemsdesc || !itemstitle || !itemsfile || !itemsversion) {
          return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
        }

        const formattedImages = Array.isArray(itemsimages) ? itemsimages : [];
        const formattedurl = itemsurlyoutube && typeof itemsurlyoutube === "string" ? itemsurlyoutube : "";
        
        // ✅ แปลง discordRoleIds ให้เป็น Array ของ String
        let formattedRoleIds = [];
        if (Array.isArray(discordRoleIds)) {
          formattedRoleIds = discordRoleIds.filter(id => id && id.trim() !== "");
        } else if (typeof discordRoleIds === "string") {
          formattedRoleIds = discordRoleIds.split(/[ ,\n]+/).filter(id => id && id.trim() !== "");
        }

        console.log("✅ Saving discordRoleIds:", formattedRoleIds);

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
          discordRoleIds: formattedRoleIds,
          currentVersion: itemsversion,  // ✅ เพิ่ม: ใช้ version เดียวกับ itemsversion
          latestUpdate: new Date(),       // ✅ เพิ่ม
          versionStatus: "stable",       // ✅ เพิ่ม
          totalDownloads: 0,             // ✅ เพิ่ม
          totalUpdates: 0,               // ✅ เพิ่ม
          tags: [],                      // ✅ เพิ่ม
          versionHistory: []             // ✅ เพิ่ม
        });

        await newItem.save();
        console.log("✅ Saved Item to MongoDB:", newItem);

        res.status(201).json(newItem);
      } catch (error) {
        console.error("❌ Error adding item:", error);
        res.status(500).json({ error: "Failed to add item" });
      }
      break;

    case "PUT":
      try {
        const { 
          id, itemsname, itemsprice, itemsimage, itemsimages, 
          itemsurlyoutube, itemsdesc, itemstitle, itemsfile, 
          itemsversion, discordRoleIds, currentVersion  // ✅ เพิ่ม currentVersion
        } = req.body;
        
        if (!id) return res.status(400).json({ error: "Missing item ID" });

        // ✅ แปลง discordRoleIds ให้เป็น Array ของ String
        let formattedRoleIds = [];
        if (Array.isArray(discordRoleIds)) {
          formattedRoleIds = discordRoleIds.filter(id => id && id.trim() !== "");
        } else if (typeof discordRoleIds === "string") {
          formattedRoleIds = discordRoleIds.split(/[ ,\n]+/).filter(id => id && id.trim() !== "");
        }

        console.log("✅ Updating discordRoleIds:", formattedRoleIds);

        const updatedItem = await Item.findByIdAndUpdate(id, {
          itemsname,
          itemsprice,
          itemsimage,
          itemsimages: itemsimages || [],
          itemsurlyoutube,
          itemsdesc,
          itemstitle,
          itemsfile,
          discordRoleIds: formattedRoleIds,
          currentVersion: currentVersion || itemsversion,  // ✅ เพิ่ม
          latestUpdate: new Date()  // ✅ เพิ่ม 
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