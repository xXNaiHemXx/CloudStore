import { connectToDB } from "../utils/db";
import Admin from "../models/Admin";

async function initAdmin() {
  await connectToDB();

  const headIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];

  for (const discordId of headIds) {
    const exists = await Admin.findOne({ discordId: discordId.trim() });
    
    if (!exists) {
      await Admin.create({
        discordId: discordId.trim(),
        name: "Head Admin",
        role: "head",
        addedBy: "System",
      });
      console.log(`✅ Created Head Admin: ${discordId}`);
    } else {
      // อัปเดตให้เป็น head ถ้ายังไม่ใช่
      if (exists.role !== "head") {
        await Admin.findByIdAndUpdate(exists._id, { role: "head" });
        console.log(`✅ Updated to Head Admin: ${discordId}`);
      }
    }
  }

  console.log("✅ Admin initialization complete");
  process.exit(0);
}

initAdmin().catch(console.error);