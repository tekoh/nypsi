import { WebhookClient } from "discord.js";
import redis from "../../database/redis";
import { CustomEmbed } from "../../models/EmbedBuilders";

(async () => {
    const hook = new WebhookClient({
        url: process.env.LOTTERY_HOOK,
    });

    const tickets = await redis.hgetall("lotterytickets:queue");

    if (Object.keys(tickets).length == 0) return;

    const desc = [];

    for (const username of Object.keys(tickets)) {
        const amount = parseInt(tickets[username]);

        desc.push(`**${username}** has bought **${amount}** lottery ticket${amount > 1 ? "s" : ""}`);

        await redis.hdel("lotterytickets:queue", username);

        if (desc.join("\n").length >= 500) break;
    }

    const embed = new CustomEmbed();

    embed.setColor("#111111");
    embed.setDescription(desc.join("\n"));
    embed.setTimestamp();
    embed.disableFooter();

    hook.send({ embeds: [embed] });

    process.exit(0);
})();
