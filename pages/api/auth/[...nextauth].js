import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { MongoClient } from "mongodb";

const clientPromise = MongoClient.connect(process.env.MONGODB_URI);

export const authOptions = {
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
            session.user.id = token.sub;
            session.user.discordId = token.sub;

            const client = await clientPromise;
            const db = client.db("CloudStore");
            const usersCollection = db.collection("users");

            const dbUser = await usersCollection.findOne({ discordId: token.sub });

            if (dbUser) {
                session.user.points = dbUser.points || 0;
                session.user.name = dbUser.name || session.user.name;
                session.user.email = dbUser.email || session.user.email;
            }

            return session;
        },
        async signIn({ user, account, profile }) {
            const client = await clientPromise;
            const db = client.db("CloudStore");
            const usersCollection = db.collection("users");

            const existingUser = await usersCollection.findOne({ discordId: user.id });

            if (!existingUser) {
                await usersCollection.insertOne({
                    discordId: user.id,
                    name: user.name,
                    email: user.email,
                    points: 0,
                    products: [],
                    loginAt: new Date(),
                });
            } else {
                await usersCollection.updateOne(
                    { discordId: user.id },
                    { $set: { loginAt: new Date() } }
                );
            }

            return true;
        },
    },
};

export default NextAuth(authOptions);