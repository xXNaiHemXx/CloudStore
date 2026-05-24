import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import Product from "@/models/Product";

export async function GET(req, { params }) {

    try {

        await connectDB();

        const product = await Product.findById(params.id);

        return NextResponse.json({
            success: true,

            currentVersion: product.currentVersion,

            latestUpdate: product.latestUpdate,

            forceUpdate: product.forceUpdate
        });

    } catch (err) {

        return NextResponse.json({
            success: false,
            message: err.message
        }, { status: 500 });
    }
}