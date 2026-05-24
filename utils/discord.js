import axios from 'axios';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

// เพิ่มหลาย Role ให้ผู้ใช้
export async function addDiscordRoles(discordUserId, roleIds) {
  console.log("📌 addDiscordRoles called with:", { discordUserId, roleIds });
  
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.log("⚠️ ไม่ได้ตั้งค่า Discord Bot Token หรือ Guild ID");
    return { success: false, added: [], failed: roleIds };
  }

  if (!roleIds || roleIds.length === 0) {
    return { success: true, added: [], failed: [] };
  }

  const results = { added: [], failed: [] };

  for (const roleId of roleIds) {
    if (!roleId || roleId === "") continue;
    
    try {
      const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
      
      await axios.put(url, {}, {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ เพิ่ม Role ${roleId} ให้ ${discordUserId} สำเร็จ`);
      results.added.push(roleId);
    } catch (error) {
      console.error(`❌ เพิ่ม Role ${roleId} ไม่สำเร็จ:`, error.response?.data || error.message);
      results.failed.push(roleId);
    }
  }

  return results;
}

// ลบหลาย Role จากผู้ใช้
export async function removeDiscordRoles(discordUserId, roleIds) {
  console.log("📌 removeDiscordRoles called with:", { discordUserId, roleIds });
  
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.log("⚠️ ไม่ได้ตั้งค่า Discord Bot Token หรือ Guild ID");
    return { success: false, removed: [], failed: roleIds };
  }

  if (!roleIds || roleIds.length === 0) {
    return { success: true, removed: [], failed: [] };
  }

  const results = { removed: [], failed: [] };

  for (const roleId of roleIds) {
    if (!roleId || roleId === "") continue;
    
    try {
      const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
      
      console.log(`📌 กำลังลบ Role ${roleId} ของผู้ใช้ ${discordUserId}...`);
      
      await axios.delete(url, {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        }
      });
      
      console.log(`✅ ลบ Role ${roleId} ของผู้ใช้ ${discordUserId} สำเร็จ`);
      results.removed.push(roleId);
    } catch (error) {
      console.error(`❌ ลบ Role ${roleId} ไม่สำเร็จ:`, error.response?.data || error.message);
      results.failed.push(roleId);
    }
  }

  return results;
}

// ดึง Role ทั้งหมดที่ผู้ใช้มี
export async function getUserRoles(discordUserId) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return [];
  }

  try {
    const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      }
    });
    
    return response.data.roles || [];
  } catch (error) {
    console.error("❌ ดึง Role ไม่สำเร็จ:", error.response?.data || error.message);
    return [];
  }
}