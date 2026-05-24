import dbConnect from "@/lib/dbConnect";

import ProductVersion from "@/models/ProductVersion";

export default async function handler(req, res) {

    try {

        await dbConnect();

        const versions = await ProductVersion
            .find({
                productId: req.query.id
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            versions
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}