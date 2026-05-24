import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Item from "../../../models/Item";
import { removeDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    await connectToDB();

    const { userId, productId, index } = req.body;

    console.log("📌 REMOVE PRODUCT:", {
      userId,
      productId,
      index
    });

    if (!userId || !productId) {
      return res.status(400).json({
        error: "Missing userId or productId"
      });
    }

    // =========================
    // FIND USER
    // =========================
    const user = await User.findOne({
      discordId: String(userId)
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const products = user.products || [];

    // =========================
    // FIND PRODUCT INDEX
    // =========================
    const matchedIndexes = products.reduce((acc, p, i) => {
      if (String(p.productId) === String(productId)) {
        acc.push(i);
      }

      return acc;
    }, []);

    if (matchedIndexes.length === 0) {
      return res.status(404).json({
        error: "Product not found in user account"
      });
    }

    let indexToRemove;

    if (
      index !== undefined &&
      matchedIndexes.includes(index)
    ) {
      indexToRemove = index;
    } else {
      indexToRemove =
        matchedIndexes[matchedIndexes.length - 1];
    }

    const removedProduct = products[indexToRemove];

    console.log("📌 PRODUCT TO REMOVE:", removedProduct);

    // =========================
    // GET PRODUCT DATA FROM ITEMS
    // =========================
    const item = await Item.findById(productId);

    if (!item) {
      console.log("⚠️ Item not found in Items collection");
    }

    console.log(
      "📌 ITEM DISCORD ROLES:",
      item?.discordRoleIds
    );

    // =========================
    // REMOVE DISCORD ROLES
    // =========================
    if (
      item?.discordRoleIds &&
      item.discordRoleIds.length > 0
    ) {
      console.log("📌 Removing Discord Roles...");

      const roleResult = await removeDiscordRoles(
        userId,
        item.discordRoleIds
      );

      console.log(
        "📌 Remove Role Result:",
        roleResult
      );
    }

    // =========================
    // REMOVE PRODUCT FROM USER
    // =========================
    user.products = products.filter(
      (_, i) => i !== indexToRemove
    );

    user.markModified("products");

    await user.save();

    console.log(
      `✅ Removed product ${productId} from user ${userId}`
    );

    return res.status(200).json({
      success: true,
      message: "ลบสินค้าสำเร็จ",
      products: user.products
    });

  } catch (error) {
    console.error("❌ REMOVE PRODUCT ERROR:", error);

    return res.status(500).json({
      error: error.message
    });
  }
}