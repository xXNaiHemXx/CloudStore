import dbConnect from "@/lib/dbConnect";

import Product from "@/models/Product";
import ProductVersion from "@/models/ProductVersion";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {

        await dbConnect();

        const {
            version,
            title,
            changelog,
            downloadUrl,
            fileSize,
            hash,
            releaseType,
            isImportant
        } = req.body;

        const product = await Product.findById(req.query.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const newVersion = await ProductVersion.create({
            productId: product._id,
            version,
            title,
            changelog,
            downloadUrl,
            fileSize,
            hash,
            releaseType,
            isImportant
        });

        product.currentVersion = version;
        product.latestUpdate = new Date();

        await product.save();

        return res.status(200).json({
            success: true,
            version: newVersion
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}