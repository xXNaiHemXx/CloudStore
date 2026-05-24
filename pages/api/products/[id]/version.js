import { connectToDB } from "@/utils/db";
import Item from "@/models/items";
import ProductVersion from "@/models/ProductVersion";

export default async function handler(req, res) {

  await connectToDB();

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing product ID" });
  }

  try {

    // ดึงสินค้า
    const product = await Item.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ดึงประวัติเวอร์ชันทั้งหมด
    const versions = await ProductVersion.find({ productId: id })
      .sort({ createdAt: -1 });

    // ดึงเวอร์ชันล่าสุด
    const latestVersion = versions[0] || null;

    return res.status(200).json({
      success: true,
      currentVersion: product.currentVersion,
      latestUpdate: product.latestUpdate,
      versionStatus: product.versionStatus,
      totalUpdates: product.totalUpdates,
      latestVersion: latestVersion,
      versions: versions,
      versionHistory: versions.map(v => ({
        version: v.version,
        title: v.title,
        changelog: v.changelog,
        releaseDate: v.createdAt,
        downloadUrl: v.downloadUrl,
        fileSize: v.fileSize,
        isImportant: v.isImportant,
        isForceUpdate: v.isForceUpdate
      }))
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });

  }

}