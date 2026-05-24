import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Items from "../../../models/items";
import { removeDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    await connectToDB();

    const { userId, productId, index } = req.body;

    console.log("📌 REMOVE PRODUCT:", {
      userId,
      productId,
      index,
    });

    if (!userId || !productId) {
      return res.status(400).json({
        error: "Missing userId or productId",
      });
    }

    // =========================
    // FIND USER
    // =========================
    const user = await User.findOne({
      discordId: String(userId),
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
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
        error: "Product not found in user account",
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
    // GET PRODUCT FROM ITEMS
    // =========================
    const item = await Items.findById(productId);

    console.log("📌 ITEM:", item?.itemsname);

    console.log(
      "📌 DISCORD ROLE IDS:",
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
        "📌 REMOVE ROLE RESULT:",
        roleResult
      );
    }

    // =========================
    // REMOVE PRODUCT
    // =========================
    user.products = products.filter(
      (_, i) => i !== indexToRemove
    );

    user.markModified("products");

    await user.save();

    console.log(
      `✅ Removed product ${productId} from ${userId}`
    );

    return res.status(200).json({
      success: true,
      message: "ลบสินค้าสำเร็จ",
      products: user.products,
    });

  } catch (error) {
    console.error(
      "❌ REMOVE PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
}