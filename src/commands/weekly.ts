import { CommandInteraction, Message } from "discord.js";
import { getBalance, getMulti, updateBalance, userExists, createUser } from "../utils/economy/utils.js";
import { getPrefix } from "../utils/guilds/utils";
import { isPremium, getTier, getLastWeekly, setLastWeekly } from "../utils/premium/utils";
import { Command, Categories, NypsiCommandInteraction } from "../utils/models/Command";
import { CustomEmbed } from "../utils/models/EmbedBuilders";
import { addCooldown, getResponse, onCooldown } from "../utils/cooldownhandler.js";

const cmd = new Command("weekly", "get your weekly bonus (patreon only)", Categories.MONEY);

/**
 * @param {Message} message
 * @param {Array<String>} args
 */
async function run(message: Message | (NypsiCommandInteraction & CommandInteraction)) {
    if (await onCooldown(cmd.name, message.member)) {
        const embed = await getResponse(cmd.name, message.member);

        return message.channel.send({ embeds: [embed] });
    }

    await addCooldown(cmd.name, message.member, 90);

    if (!(await userExists(message.member))) {
        createUser(message.member);
    }

    const notValidForYou = () => {
        const embed = new CustomEmbed(
            message.member,
            false,
            `${getPrefix(message.guild)}weekly is for SILVER tier and higher`
        ).setFooter(`${getPrefix(message.guild)}patreon`);

        return message.channel.send({ embeds: [embed] });
    };

    if (!isPremium(message.author.id)) {
        return notValidForYou();
    } else {
        if (getTier(message.author.id) < 2) {
            return notValidForYou();
        }

        const now = new Date().getTime();
        const lastWeekly = getLastWeekly(message.author.id);
        const diff = now - lastWeekly;

        if (diff >= 604800000) {
            setLastWeekly(message.author.id, now);

            let amount = 150000;
            const multi = await getMulti(message.member);

            let description = `$${getBalance(message.member).toLocaleString()}\n + $**${amount.toLocaleString()}**`;

            if (multi > 0) {
                amount = amount + Math.round(amount * multi);
                description = `$${getBalance(
                    message.member
                ).toLocaleString()}\n + $**${amount.toLocaleString()}** (+**${Math.floor(
                    multi * 100
                ).toLocaleString()}**% bonus)`;
            }

            updateBalance(message.member, getBalance(message.member) + amount);

            const embed = new CustomEmbed(message.member, false, description);

            return message.channel.send({ embeds: [embed] }).then((msg) => {
                setTimeout(() => {
                    embed.setDescription(`new balance: $**${getBalance(message.member).toLocaleString()}**`);
                    msg.edit({ embeds: [embed] });
                }, 2000);
            });
        } else {
            const timeRemaining = Math.abs(604800000 - diff);
            const dd = timeUntil(new Date().getTime() + timeRemaining);

            const embed = new CustomEmbed(
                message.member,
                false,
                "you have already used your weekly reward! come back in **" + dd + "**"
            );

            return message.channel.send({ embeds: [embed] });
        }
    }
}

function timeUntil(date) {
    const ms = Math.floor(date - new Date().getTime());

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const daysms = ms % (24 * 60 * 60 * 1000);
    const hours = Math.floor(daysms / (60 * 60 * 1000));
    const hoursms = ms % (60 * 60 * 1000);
    const minutes = Math.floor(hoursms / (60 * 1000));
    const minutesms = ms % (60 * 1000);
    const sec = Math.floor(minutesms / 1000);

    let output = "";

    if (days > 0) {
        output = output + days + "d ";
    }

    if (hours > 0) {
        output = output + hours + "h ";
    }

    if (minutes > 0) {
        output = output + minutes + "m ";
    }

    if (sec > 0) {
        output = output + sec + "s";
    } else if (output != "") {
        output = output.substr(0, output.length - 1);
    }

    if (output == "") {
        output = "0s";
    }

    return output;
}

cmd.setRun(run);

module.exports = cmd;
