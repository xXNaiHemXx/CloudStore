import { connectToDB } from "../../../utils/db";
import Purchase from "../../../models/Purchase";
import User from "../../../models/User";
import Item from "../../../models/items";

export default async function handler(req, res) {
  await connectToDB();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const purchases = await Purchase.find({}).sort({ createdAt: -1 });

    const fullOrders = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await User.findOne({ discordId: purchase.userId });
        const item = await Item.findById(purchase.productId);

        return {
          productId: purchase.productId,
          productName: item?.itemsname || "Unknown",
          buyerId: user?.discordId || purchase.userId,
          buyerName: user?.name || "Unknown",
          price: purchase.price || item?.itemsprice || 0,
          purchaseDate: purchase.purchaseDate,
        };
      })
    );

    res.status(200).json(fullOrders);
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    res.status(500).json({ error: "Failed to load purchases" });
  }
}
