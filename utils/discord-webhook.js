import axios from "axios";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordNotification(data) {

  if (!DISCORD_WEBHOOK_URL) {
    console.log("⚠️ No Discord webhook URL configured");
    return;
  }

  const {
    productName,
    oldVersion,
    newVersion,
    title,
    changelog,
    downloadUrl,
    isImportant,
    isForceUpdate,
    userCount
  } = data;

  const changelogText = Array.isArray(changelog) 
    ? changelog.map(line => `- ${line}`).join("\n")
    : changelog;

  const embed = {
    title: isImportant ? "🚀 IMPORTANT UPDATE" : "📦 New Update Available",
    description: `**${productName}** has been updated!`,
    color: isImportant ? 0xff0000 : 0x00ff00,
    fields: [
      {
        name: "📌 Version",
        value: `${oldVersion || "N/A"} → **${newVersion}**`,
        inline: true
      },
      {
        name: "📝 Update Title",
        value: title,
        inline: true
      },
      {
        name: "⚠️ Force Update",
        value: isForceUpdate ? "✅ Yes" : "❌ No",
        inline: true
      },
      {
        name: "📋 Changelog",
        value: changelogText || "No changelog provided",
        inline: false
      },
      {
        name: "👥 Affected Users",
        value: `${userCount} users need to update`,
        inline: true
      },
      {
        name: "📥 Download",
        value: `[Click here to download](${downloadUrl})`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "CloudStore Version System"
    }
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: "CloudStore Updater",
      avatar_url: "https://your-domain.com/logo.png",
      embeds: [embed]
    });

    console.log("✅ Discord notification sent");

  } catch (error) {
    console.error("❌ Failed to send Discord notification:", error.message);
  }

}