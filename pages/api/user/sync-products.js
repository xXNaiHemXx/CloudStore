import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import Item from "@/models/items";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDB();
    const { userId } = req.body;
    
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // ดึงสินค้าทั้งหมดล่าสุด
    const allItems = await Item.find({});
    const itemMap = new Map();
    allItems.forEach(item => {
      itemMap.set(item._id.toString(), item);
    });
    
    let updated = false;
    const syncedProducts = (user.products || []).map(p => {
      const latestItem = itemMap.get(p.productId);
      if (latestItem && (p.image !== latestItem.itemsimage || p.version !== latestItem.itemsversion)) {
        updated = true;
        return {
          ...p.toObject(),
          name: latestItem.itemsname,
          image: latestItem.itemsimage,
          version: latestItem.itemsversion,
          fileUrl: latestItem.itemsfile,
          itemsimage: latestItem.itemsimages,
        };
      }
      return p;
    });
    
    if (updated) {
      user.products = syncedProducts;
      user.markModified("products");
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      products: syncedProducts,
      updated
    });
  } catch (error) {
    console.error("Sync products error:", error);
    return res.status(500).json({ error: error.message });
  }
}