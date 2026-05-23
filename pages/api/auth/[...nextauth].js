import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { MongoClient } from "mongodb";

const clientPromise = MongoClient.connect(process.env.MONGODB_URI);

export default NextAuth({
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/",
    },
    callbacks: {
        async session({ session, token }) {
            session.user.id = token.sub; // ✅ ดึง Discord ID แล้วใส่ใน session

            const client = await clientPromise;
            const db = client.db("CloudStore");
            const usersCollection = db.collection("users");

            const dbUser = await usersCollection.findOne({ discordId: token.sub });

            if (dbUser) {
                session.user.points = dbUser.points || 0; // ✅ ดึง Point จาก Database
            }

            return session;
        },
        async signIn({ user, account, profile }) {
            const client = await clientPromise;
            const db = client.db("CloudStore");
            const usersCollection = db.collection("users");

            const existingUser = await usersCollection.findOne({ discordId: user.id });

            if (!existingUser) {
                // ✅ บันทึกข้อมูลใหม่ลง Database
                await usersCollection.insertOne({
                    discordId: user.id,
                    name: user.name,
                    email: user.email,
                    points: 0, // ✅ เริ่มต้นที่ 0
                    loginAt: new Date(),
                });
            } else {
                // ✅ อัปเดตเวลาล็อกอินล่าสุด
                await usersCollection.updateOne(
                    { discordId: user.id },
                    { $set: { loginAt: new Date() } }
                );
            }

            return true;
        },
    },
});
