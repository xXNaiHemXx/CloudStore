import dbConnect from "@/lib/dbConnect";

import Product from "@/models/Product";

export default async function handler(req, res) {

    try {

        await dbConnect();

        const product = await Product.findById(req.query.id);

        return res.status(200).json({
            success: true,
            currentVersion: product.currentVersion,
            latestUpdate: product.latestUpdate,
            forceUpdate: product.forceUpdate
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}