import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("⚠️ กรุณาตั้งค่า MONGODB_URI ใน .env.local");
}

/**
 * Global cache
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

export async function connectToDB() {
    // ถ้ามี connection อยู่แล้ว
    if (cached.conn) {
        return cached.conn;
    }

    // ถ้ายังไม่มี promise ให้สร้างใหม่
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: "CloudStore",
        });
    }

    try {
        cached.conn = await cached.promise;

        console.log("✅ Connected to MongoDB");

        return cached.conn;
    } catch (error) {
        cached.promise = null;

        console.error("❌ MongoDB connection error:", error);

        throw error;
    }
}