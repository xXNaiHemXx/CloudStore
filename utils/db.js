import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("⚠️ กรุณาตั้งค่า MONGODB_URI ใน .env.local");
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectToDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then((mongoose) => {
            console.log('✅ Connected to MongoDB at:', MONGODB_URI); // ✅ Log ว่าต่อ MongoDB สำเร็จ
            return mongoose;
        }).catch(error => {
            console.error("❌ MongoDB connection error:", error);
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
