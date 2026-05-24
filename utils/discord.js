export async function removeDiscordRoles(
  discordUserId,
  roleIds
) {
  console.log("📌 [removeDiscordRoles]");

  const results = {
    removed: [],
    failed: [],
  };

  for (const roleId of roleIds) {
    try {

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();

        console.error(
          `❌ Failed remove role ${roleId}:`,
          text
        );

        results.failed.push({
          roleId,
          error: text,
        });

        continue;
      }

      console.log(
        `✅ Removed role ${roleId} from ${discordUserId}`
      );

      results.removed.push(roleId);

    } catch (error) {

      console.error(
        `❌ Error removing role ${roleId}:`,
        error.message
      );

      results.failed.push({
        roleId,
        error: error.message,
      });
    }
  }

  return results;
}