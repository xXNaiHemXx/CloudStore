import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { MongoClient } from "mongodb";
import { getUserRoles } from "@/utils/discord";

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
            const itemsCollection = db.collection("items");

            const existingUser = await usersCollection.findOne({ discordId: user.id });

            //  ดึง Role ที่ user มีใน Discord
            const userRoles = await getUserRoles(user.id);
            console.log("📌 User roles from Discord:", userRoles);
            
            //  หาสินค้าทั้งหมดที่ตรงกับ Role ที่ user มี
            const productsWithMatchingRoles = await itemsCollection.find({
                discordRoleIds: { $in: userRoles }  //  ใช้ discordRoleIds (array)
            }).toArray();
            
            console.log("📌 Products matching user's roles:", productsWithMatchingRoles.map(p => p.itemsname));

            if (!existingUser) {
                // สร้างผู้ใช้ใหม่ พร้อมเพิ่มสินค้าจาก Role ที่มีอยู่แล้ว
                await usersCollection.insertOne({
                    discordId: user.id,
                    name: user.name,
                    email: user.email,
                    points: 0,
                    products: productsWithMatchingRoles.map(product => ({
                        productId: product._id.toString(),
                        name: product.itemsname,
                        image: product.itemsimage,
                        version: product.itemsversion,
                        fileUrl: product.itemsfile,
                        purchaseDate: new Date(),
                        discordRoleIds: product.discordRoleIds || [],
                        syncedFromDiscord: true,
                    })),
                    loginAt: new Date(),
                });
                console.log(`✅ สร้างผู้ใช้ใหม่ ${user.name} และเพิ่มสินค้าจาก Role ${userRoles.length} รายการ`);
            } else {
                //  อัปเดตสินค้าให้ตรงกับ Role ที่มีใน Discord (sync)
                const existingProductIds = existingUser.products?.map(p => p.productId) || [];
                const newProducts = productsWithMatchingRoles.filter(
                    p => !existingProductIds.includes(p._id.toString())
                ).map(product => ({
                    productId: product._id.toString(),
                    name: product.itemsname,
                    image: product.itemsimage,
                    version: product.itemsversion,
                    fileUrl: product.itemsfile,
                    purchaseDate: new Date(),
                    discordRoleIds: product.discordRoleIds || [],
                    syncedFromDiscord: true,
                }));

                if (newProducts.length > 0) {
                    await usersCollection.updateOne(
                        { discordId: user.id },
                        { 
                            $push: { products: { $each: newProducts } },
                            $set: { loginAt: new Date() }
                        }
                    );
                    console.log(`✅ เพิ่มสินค้าใหม่ ${newProducts.length} รายการ ให้ ${user.name}`);
                } else {
                    await usersCollection.updateOne(
                        { discordId: user.id },
                        { $set: { loginAt: new Date() } }
                    );
                }
            }

            return true;
        },
    },
};

export default NextAuth(authOptions);