import axios from "axios";

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function removeDiscordRoles(
  discordUserId,
  roleIds
) {
  console.log("📌 removeDiscordRoles called:", {
    discordUserId,
    roleIds
  });

  const results = {
    removed: [],
    failed: []
  };

  for (const roleId of roleIds) {
    try {

      await axios.delete(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
        {
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`
          }
        }
      );

      console.log(
        `✅ Removed role ${roleId} from ${discordUserId}`
      );

      results.removed.push(roleId);

    } catch (error) {

      console.error(
        `❌ Failed removing role ${roleId}`,
        error.response?.data || error.message
      );

      results.failed.push({
        roleId,
        error:
          error.response?.data || error.message
      });
    }
  }

  return results;
}