import { connectToDB } from "@/utils/db";
import Product from "@/models/Product";
import User from "@/models/User";

export default async function handler(req, res) {
    await connectToDB();

    if (req.method === "GET") {
        try {
            const { userId } = req.query;

            if (!userId) return res.status(400).json({ error: "Missing userId" });

            const user = await User.findOne({ discordId: userId });
            if (!user) return res.status(404).json({ error: "User not found" });

            // ✅ ดึงสินค้าที่เป็นของผู้ใช้
            const userProducts = await Product.find({ owners: user._id });

            res.status(200).json({ products: userProducts });
        } catch (error) {
            console.error("Error fetching user products:", error);
            res.status(500).json({ error: "Failed to fetch user products" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
