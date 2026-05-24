import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import ProductVersion from "@/models/ProductVersion";

export async function GET(req, { params }) {

    try {

        await connectDB();

        const versions = await ProductVersion
            .find({
                productId: params.id
            })
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            versions
        });

    } catch (err) {

        return NextResponse.json({
            success: false,
            message: err.message
        }, { status: 500 });
    }
}