import axios from 'axios';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

// ลบหลาย Role จากผู้ใช้
export async function removeDiscordRoles(discordUserId, roleIds) {
  console.log("📌 removeDiscordRoles called with:", { discordUserId, roleIds });
  
  // ตรวจสอบ Environment Variables
  if (!DISCORD_BOT_TOKEN) {
    console.error("❌ DISCORD_BOT_TOKEN is not set in .env.local");
    return { success: false, removed: [], failed: roleIds, error: "Missing Bot Token" };
  }
  
  if (!DISCORD_GUILD_ID) {
    console.error("❌ DISCORD_GUILD_ID is not set in .env.local");
    return { success: false, removed: [], failed: roleIds, error: "Missing Guild ID" };
  }

  if (!roleIds || roleIds.length === 0) {
    console.log("⚠️ ไม่มี Role IDs ให้ลบ");
    return { success: true, removed: [], failed: [] };
  }

  const results = { removed: [], failed: [] };

  for (const roleId of roleIds) {
    if (!roleId || roleId === "") continue;
    
    try {
      const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`;
      
      console.log(`📌 DELETE Request to: ${url}`);
      
      const response = await axios.delete(url, {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ ลบ Role ${roleId} ของผู้ใช้ ${discordUserId} สำเร็จ (Status: ${response.status})`);
      results.removed.push(roleId);
    } catch (error) {
      console.error(`❌ ลบ Role ${roleId} ไม่สำเร็จ:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Error:`, error.response?.data || error.message);
      
      // แสดงสาเหตุที่เป็นไปได้
      if (error.response?.status === 403) {
        console.error(`   🔴 สาเหตุ: Bot ไม่มีสิทธิ์ Manage Roles หรือ Role สูงกว่า Bot`);
      } else if (error.response?.status === 404) {
        console.error(`   🔴 สาเหตุ: ไม่พบผู้ใช้ ${discordUserId} หรือ Role ${roleId} ใน Server`);
      } else if (error.response?.status === 401) {
        console.error(`   🔴 สาเหตุ: Bot Token ไม่ถูกต้อง`);
      }
      
      results.failed.push(roleId);
    }
  }

  console.log("📌 removeDiscordRoles results:", results);
  return results;
}

// เพิ่ม Role (สำหรับกรณีซื้อสินค้า)
export async function addDiscordRoles(discordUserId, roleIds) {
  console.log("📌 addDiscordRoles called with:", { discordUserId, roleIds });
  
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.error("❌ Missing Discord configuration");
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