import { connectToDB } from "@/utils/db";
import User from "@/models/User";

export default async function handler(req, res) {
    await connectToDB();

    if (req.method === "GET") {
        const { discordId } = req.query;
        if (!discordId) return res.status(400).json({ error: "Missing discordId" });

        const user = await User.findOne({ discordId });
        if (!user) return res.status(404).json({ error: "User not found" });

        return res.status(200).json({ 
            userId: user.discordId,
            name: user.name,
            email: user.email,
            points: user.points || 0,
            products: user.products || []  //  ป้องกัน undefined
        });
    }

    if (req.method === "POST") { 
        try {
            const { discordId, name, email } = req.body;

            if (!discordId || !name || !email) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            let user = await User.findOne({ discordId });

            if (!user) {
                user = new User({ discordId, name, email, points: 0, products: [] }); //  กำหนด products เป็น []
                await user.save();
            }

            return res.status(200).json({ message: "User saved successfully", user });
        } catch (error) {
            console.error("Error saving user:", error);
            return res.status(500).json({ error: "Server error" });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" }); 
}
