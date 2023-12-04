import {
  ActionRowBuilder,
  APIApplicationCommandOptionChoice,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { Command, NypsiCommandInteraction } from "../models/Command";
import { CustomEmbed, ErrorEmbed } from "../models/EmbedBuilders.js";
import { Item } from "../types/Economy.js";
import { getGuildByUser } from "../utils/functions/economy/guilds";
import { selectItem } from "../utils/functions/economy/inventory";
import {
  topBalance,
  topCommand,
  topCommandGlobal,
  topCommandUses,
  topCommandUsesGlobal,
  topCompletion,
  topDailyStreak,
  topDailyStreakGlobal,
  topGuilds,
  topItem,
  topItemGlobal,
  topLottoWins,
  topLottoWinsGlobal,
  topNetWorth,
  topNetWorthGlobal,
  topPrestige,
  topPrestigeGlobal,
  topVote,
  topVoteGlobal,
  topWordle,
  topWordleGlobal,
} from "../utils/functions/economy/top";
import { getItems } from "../utils/functions/economy/utils.js";
import { getPrefix } from "../utils/functions/guilds/utils";
import PageManager from "../utils/functions/page";
import { commands } from "../utils/handlers/commandhandler";
import { addCooldown, getResponse, onCooldown } from "../utils/handlers/cooldownhandler.js";

const cmd = new Command("top", "view top etc. in the server", "money").setAliases([
  "baltop",
  "gangsters",
]);

const scopeChoices: APIApplicationCommandOptionChoice<string>[] = [
  { name: "global", value: "global" },
  { name: "server", value: "server" },
];

cmd.slashEnabled = true;
cmd.slashData
  .addSubcommand((balance) =>
    balance.setName("balance").setDescription("view top balances in the server"),
  )
  .addSubcommand((prestige) =>
    prestige
      .setName("prestige")
      .setDescription("view top prestiges in the server")
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((prestige) =>
    prestige
      .setName("vote")
      .setDescription("view top votes in the server")
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((prestige) =>
    prestige
      .setName("dailystreak")
      .setDescription("view top daily streaks in the server")
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((prestige) =>
    prestige
      .setName("lottery")
      .setDescription("view top lottery wins in the server")
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((prestige) =>
    prestige
      .setName("wordle")
      .setDescription("view top wordle wins in the server")
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((item) =>
    item
      .setName("item")
      .setDescription("view top item holders in the server")
      .addStringOption((option) =>
        option
          .setName("item-global")
          .setDescription("item to query")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((guild) => guild.setName("guilds").setDescription("view top nypsi guilds"))
  .addSubcommand((completion) =>
    completion.setName("completion").setDescription("view top completion in the server"),
  )
  .addSubcommand((networth) =>
    networth
      .setName("networth")
      .setDescription("view top networths in the server")

      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  )
  .addSubcommand((command) =>
    command
      .setName("command")
      .setDescription("view top command uses in the server")

      .addStringOption((option) =>
        option
          .setName("scope")
          .setDescription("show global/server")
          .setChoices(...scopeChoices)
          .setRequired(false),
      ),
  );

async function run(
  message: Message | (NypsiCommandInteraction & CommandInteraction),
  args: string[],
) {
  const send = async (data: BaseMessageOptions | InteractionReplyOptions) => {
    if (!(message instanceof Message)) {
      let usedNewMessage = false;
      let res;

      if (message.deferred) {
        res = await message.editReply(data).catch(async () => {
          usedNewMessage = true;
          return await message.channel.send(data as BaseMessageOptions);
        });
      } else {
        res = await message.reply(data as InteractionReplyOptions).catch(() => {
          return message.editReply(data).catch(async () => {
            usedNewMessage = true;
            return await message.channel.send(data as BaseMessageOptions);
          });
        });
      }

      if (usedNewMessage && res instanceof Message) return res;

      const replyMsg = await message.fetchReply();
      if (replyMsg instanceof Message) {
        return replyMsg;
      }
    } else {
      return await message.channel.send(data as BaseMessageOptions);
    }
  };

  if (await onCooldown(cmd.name, message.member)) {
    const embed = await getResponse(cmd.name, message.member);

    return send({ embeds: [embed], ephemeral: true });
  }

  await addCooldown(cmd.name, message.member, 5);

  const show = async (pages: Map<number, string[]>, pos: number, title: string, url?: string) => {
    const embed = new CustomEmbed(message.member).setHeader(
      title,
      title.includes("global") || title.includes("guild")
        ? message.guild.iconURL()
        : message.client.user.avatarURL(),
      url,
    );

    if (pages.size == 0) {
      embed.setDescription("no data to show");
    } else {
      embed.setDescription(pages.get(1).join("\n"));
    }

    if (pos != 0) {
      embed.setFooter({ text: `you are #${pos}` });
    }

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("⬅")
        .setLabel("back")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder().setCustomId("➡").setLabel("next").setStyle(ButtonStyle.Primary),
    );

    if (pages.size <= 1) {
      return send({ embeds: [embed] });
    }

    const msg = await send({ embeds: [embed], components: [row] });

    const manager = new PageManager({
      embed: embed,
      message: msg,
      row: row,
      userId: message.author.id,
      pages: pages,
      allowMessageDupe: true,
    });

    return manager.listen();
  };

  if (args.length == 0) {
    const data = await topBalance(message.guild, message.author.id);

    return show(data.pages, data.pos, `top balance for ${message.guild.name}`);
  } else if (args[0].toLowerCase() == "balance") {
    const data = await topBalance(message.guild, message.author.id);

    return show(data.pages, data.pos, `top balance for ${message.guild.name}`);
  } else if (args[0].toLowerCase() == "prestige" || args[0].toLowerCase() === "level") {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topPrestigeGlobal(message.author.id);
    } else {
      data = await topPrestige(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top prestige ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? "https://nypsi.xyz/leaderboard/prestige" : null,
    );
  } else if (args[0].toLowerCase() == "item") {
    const items = getItems();
    const searchTag = args[1].toLowerCase();

    let item: Item;

    for (const itemName of Array.from(Object.keys(items))) {
      const aliases = items[itemName].aliases ? items[itemName].aliases : [];
      if (searchTag == itemName) {
        item = items[itemName];
        break;
      } else if (searchTag == itemName.split("_").join("")) {
        item = items[itemName];
        break;
      } else if (aliases.indexOf(searchTag) != -1) {
        item = items[itemName];
        break;
      } else if (searchTag == items[itemName].name) {
        item = items[itemName];
        break;
      }
    }

    if (!item) {
      return send({ embeds: [new ErrorEmbed(`couldn't find ${searchTag}`)] });
    }

    let global = false;

    if (args[2]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topItemGlobal(item.id, message.author.id);
    } else {
      data = await topItem(message.guild, item.id, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top ${item.name} ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? `https://nypsi.xyz/leaderboard/${item.id}` : null,
    );
  } else if (args[0].toLowerCase() == "completion") {
    const data = await topCompletion(message.guild, message.author.id);

    return show(data.pages, data.pos, `top completion in ${message.guild.name}`);
  } else if (args[0].toLowerCase() == "net" || args[0].toLowerCase() == "networth") {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topNetWorthGlobal(message.author.id);
    } else {
      data = await topNetWorth(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top net worth ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? "https://nypsi.xyz/leaderboard/networth" : null,
    );
  } else if (args[0].toLowerCase().includes("guild")) {
    const userGuild = await getGuildByUser(message.member);

    const data = await topGuilds(userGuild?.guildName);

    return show(data.pages, data.pos, "top guilds");
  } else if (args[0].toLowerCase().includes("streak")) {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topDailyStreakGlobal(message.author.id);
    } else {
      data = await topDailyStreak(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top daily streak ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? "https://nypsi.xyz/leaderboard/streak" : null,
    );
  } else if (args[0].toLowerCase().includes("lott")) {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topLottoWinsGlobal(message.author.id);
    } else {
      data = await topLottoWins(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top lottery wins ${global ? "[global]" : `for ${message.guild.name}`}`,
    );
  } else if (args[0].toLowerCase().includes("wordle")) {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topWordleGlobal(message.author.id);
    } else {
      data = await topWordle(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top wordle wins ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? "https://nypsi.xyz/leaderboard/wordle" : null,
    );
  } else if (args[0].toLowerCase().includes("vote")) {
    let global = false;

    if (args[1]?.toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topVoteGlobal(message.author.id);
    } else {
      data = await topVote(message.guild, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top votes ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? "https://nypsi.xyz/leaderboard/vote" : null,
    );
  } else if (args[0].toLowerCase() === "cmd" || args[0].toLowerCase() === "command") {
    let data: { pages: Map<number, string[]>; pos: number };
    let title: string;

    if (args.length === 1 || args[1]?.toLowerCase() === "global") {
      if (args[1]?.toLowerCase() === "global") {
        data = await topCommandUsesGlobal(message.author.id);
        title = `top command uses [global]`;
      } else {
        data = await topCommandUses(message.guild, message.author.id);
        title = `top command uses for ${message.guild.name}`;
      }
    } else {
      const cmd = args[1]?.toLowerCase();

      if (!commands.has(cmd)) {
        return send({ embeds: [new ErrorEmbed(`couldn't find ${cmd}`)] });
      }
      let global = false;

      if (args[2]?.toLowerCase() == "global") global = true;

      if (global) {
        data = await topCommandGlobal(cmd, message.author.id);
      } else {
        data = await topCommand(message.guild, cmd, message.author.id);
      }

      title = `top ${await getPrefix(message.guild)}${cmd} uses ${
        global ? "[global]" : `for ${message.guild.name}`
      }`;
    }

    return show(data.pages, data.pos, title);
  } else {
    const selected =
      selectItem(args.join(" ")) ||
      selectItem(args.slice(0, args.length - 1).join(" ")) ||
      selectItem(args[0]);

    if (!selected) return send({ embeds: [new ErrorEmbed("invalid option")] });

    let global = false;

    if (args[args.length - 1].toLowerCase() == "global") global = true;

    let data: { pages: Map<number, string[]>; pos: number };

    if (global) {
      data = await topItemGlobal(selected.id, message.author.id);
    } else {
      data = await topItem(message.guild, selected.id, message.author.id);
    }

    return show(
      data.pages,
      data.pos,
      `top ${selected.name} ${global ? "[global]" : `for ${message.guild.name}`}`,
      global ? `https://nypsi.xyz/leaderboard/${selected.id}` : null,
    );
  }
}

cmd.setRun(run);

module.exports = cmd;
