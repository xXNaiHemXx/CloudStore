import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import Product from "@/models/Product";
import ProductVersion from "@/models/ProductVersion";

export async function POST(req, { params }) {

    try {

        await connectDB();

        const body = await req.json();

        const {
            version,
            title,
            changelog,
            downloadUrl,
            fileSize,
            hash,
            releaseType,
            isImportant
        } = body;

        const product = await Product.findById(params.id);

        if (!product) {
            return NextResponse.json({
                success: false,
                message: "Product not found"
            }, { status: 404 });
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

        return NextResponse.json({
            success: true,
            version: newVersion
        });

    } catch (err) {

        console.log(err);

        return NextResponse.json({
            success: false,
            message: err.message
        }, { status: 500 });
    }
}