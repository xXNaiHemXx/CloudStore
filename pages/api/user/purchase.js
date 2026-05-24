import { connectToDB } from "../../../utils/db";
import User from "../../../models/User";
import Items from "../../../models/items";

import { addDiscordRoles } from "../../../utils/discord";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {

    await connectToDB();

    const {
      userId,
      productId,
      price,
    } = req.body;

    console.log("📌 PURCHASE:", {
      userId,
      productId,
      price,
    });

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

    // =========================
    // FIND PRODUCT
    // =========================
    const product = await Items.findById(productId);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    console.log("📌 PRODUCT:", {
      name: product.itemsname,
      discordRoleIds:
        product.discordRoleIds,
    });

    // =========================
    // CHECK POINTS
    // =========================
    if (
      Number(user.points || 0) <
      Number(price || 0)
    ) {
      return res.status(400).json({
        error: "แต้มไม่เพียงพอ",
      });
    }

    // =========================
    // CHECK DUPLICATE
    // =========================
    const alreadyPurchased =
      (user.products || []).some(
        (p) =>
          String(p.productId) ===
          String(productId)
      );

    if (alreadyPurchased) {
      return res.status(400).json({
        error: "คุณซื้อสินค้านี้แล้ว",
      });
    }

    // =========================
    // REMOVE POINTS
    // =========================
    user.points =
      Number(user.points || 0) -
      Number(price || 0);

    // =========================
    // SAVE PRODUCT
    // =========================
      user.products.push({
        productId: product._id,
        name: product.itemsname,
        version: product.itemsversion,
        fileUrl: product.itemsfile,
        image: product.itemsimages?.[0] || "",
        itemsimages: product.itemsimages || [],
        discordRoleIds: product.discordRoleIds || [],
        purchasedAt: new Date(),
      });

    // =========================
    // ADD DISCORD ROLES
    // =========================
    if (
      product.discordRoleIds &&
      product.discordRoleIds.length > 0
    ) {

      console.log(
        "📌 Adding Discord Roles..."
      );

      const roleResult =
        await addDiscordRoles(
          userId,
          product.discordRoleIds
        );

      console.log(
        "📌 ADD ROLE RESULT:",
        roleResult
      );
    }

    // =========================
    // SAVE USER
    // =========================
    user.markModified("products");

    await user.save();

    console.log(
      `✅ Purchase success: ${product.itemsname}`
    );

    return res.status(200).json({
      success: true,
      remainingPoints: user.points,
      product: {
        id: product._id,
        name: product.itemsname,
      },
    });

  } catch (error) {

    console.error(
      "❌ PURCHASE ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
}