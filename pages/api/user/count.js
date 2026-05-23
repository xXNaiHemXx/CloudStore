import { connectToDB } from "@/utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
    await connectToDB();

    if (req.method === "GET") {
        try {
            const userCount = await User.countDocuments(); // ✅ นับจำนวน Users ทั้งหมด
            res.status(200).json({ count: userCount });
        } catch (error) {
            console.error("Error fetching user count:", error);
            res.status(500).json({ error: "Failed to fetch user count" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
