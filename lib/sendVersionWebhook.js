export async function sendVersionWebhook(product, version) {

    if (!process.env.DISCORD_WEBHOOK_URL)
        return;

    await fetch(process.env.DISCORD_WEBHOOK_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            embeds: [
                {
                    title: `🚀 ${product.name} Updated`,

                    description:
                        `Version ${version.version} released`,

                    color: 65280,

                    fields: [
                        {
                            name: "Version",
                            value: version.version
                        },
                        {
                            name: "Release Type",
                            value: version.releaseType
                        }
                    ]
                }
            ]
        })
    });
}