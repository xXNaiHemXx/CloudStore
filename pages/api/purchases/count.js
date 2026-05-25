import { connectToDB } from "@/utils/db";
import Purchase from "@/models/Purchase";

export default async function handler(req, res) {
    await connectToDB();

    if (req.method === "GET") {
        try {
            const purchaseCount = await Purchase.countDocuments(); //  นับจำนวนการซื้อทั้งหมด
            res.status(200).json({ count: purchaseCount });
        } catch (error) {
            console.error("Error fetching purchase count:", error);
            res.status(500).json({ error: "Failed to fetch purchase count" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
