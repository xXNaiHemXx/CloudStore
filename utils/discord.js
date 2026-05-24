const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// =============================
// เพิ่ม Role
// =============================
export async function addDiscordRoles(discordUserId, roleIds = []) {

  console.log("📌 [addDiscordRoles] เริ่มทำงาน");
  console.log("discordUserId:", discordUserId);
  console.log("roleIds:", roleIds);

  if (!discordUserId || !Array.isArray(roleIds)) {
    return {
      added: [],
      failed: roleIds || [],
    };
  }

  const added = [];
  const failed = [];

  for (const roleId of roleIds) {
    try {

      const res = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
          },
        }
      );

      if (res.ok) {
        console.log(`✅ เพิ่ม Role ${roleId} ให้ ${discordUserId} สำเร็จ`);
        added.push(roleId);
      } else {
        const text = await res.text();
        console.error(`❌ เพิ่ม Role ${roleId} ไม่สำเร็จ`, text);
        failed.push(roleId);
      }

    } catch (err) {
      console.error(`❌ Error Role ${roleId}:`, err.message);
      failed.push(roleId);
    }
  }

  return { added, failed };
}

// =============================
// ลบ Role
// =============================
export async function removeDiscordRoles(discordUserId, roleIds = []) {

  console.log("📌 [removeDiscordRoles] เริ่มทำงาน");

  if (!discordUserId || !Array.isArray(roleIds)) {
    return {
      removed: [],
      failed: roleIds || [],
    };
  }

  const removed = [];
  const failed = [];

  for (const roleId of roleIds) {
    try {

      const res = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
          },
        }
      );

      if (res.ok) {
        console.log(`✅ ลบ Role ${roleId} จาก ${discordUserId} สำเร็จ`);
        removed.push(roleId);
      } else {
        const text = await res.text();
        console.error(`❌ ลบ Role ${roleId} ไม่สำเร็จ`, text);
        failed.push(roleId);
      }

    } catch (err) {
      console.error(`❌ Error Remove Role ${roleId}:`, err.message);
      failed.push(roleId);
    }
  }

  return { removed, failed };
}

// =============================
// ดึง Role ของ User
// =============================
export async function getUserRoles(discordUserId) {

  try {

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      console.error("❌ getUserRoles failed");
      return [];
    }

    const data = await res.json();

    return data.roles || [];

  } catch (err) {

    console.error("❌ getUserRoles error:", err);

    return [];
  }
}