import { connectToDB } from "@/utils/db";
import User from "@/models/User";
import { requireUser } from "@/utils/checkAdmin";
import { sameOrigin, serverError } from "@/utils/apiGuard";

// ข้อมูลของ "ตัวเอง" เท่านั้น — discordId มาจาก session ไม่ใช่ query/body
export default async function handler(req, res) {
    if (!sameOrigin(req, res)) return;

    const me = await requireUser(req, res);
    if (!me) return;

    await connectToDB();
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
        const user = await User.findOne({ discordId: me.userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        return res.status(200).json({
            userId: user.discordId,
            name: user.name,
            email: user.email,
            points: user.points || 0,
            products: user.products || []
        });
    }

    if (req.method === "POST") {
        try {
            let user = await User.findOne({ discordId: me.userId });

            if (!user) {
                user = new User({
                    discordId: me.userId,
                    name: me.session.user.name || "Unknown",
                    email: me.session.user.email || "",
                    points: 0,
                    products: [],
                });
                await user.save();
            }

            return res.status(200).json({ message: "User saved successfully" });
        } catch (error) {
            return serverError(res, error, "user:POST");
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
