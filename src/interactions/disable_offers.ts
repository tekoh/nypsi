import prisma from "../init/database";
import redis from "../init/redis";
import { CustomEmbed } from "../models/EmbedBuilders";
import { InteractionHandler } from "../types/InteractionHandler";
import Constants from "../utils/Constants";
import { isEcoBanned } from "../utils/functions/economy/utils";
import { getPreferences, updatePreferences } from "../utils/functions/users/notifications";

export default {
  name: "disable-offers",
  async run(interaction) {
    if (!interaction.isButton()) return;
    if (await isEcoBanned(interaction.user.id)) return;

    if (await redis.exists(`${Constants.redis.nypsi.OFFER_PROCESS}:${interaction.user.id}`)) {
      return interaction.reply({
        embeds: [
          new CustomEmbed(null, "please wait until your other offer has processed").setColor(
            Constants.TRANSPARENT_EMBED_COLOR
          ),
        ],
        ephemeral: true,
      });
    }

    await redis.set(`${Constants.redis.nypsi.OFFER_PROCESS}:${interaction.user.id}`, "t");
    await redis.expire(`${Constants.redis.nypsi.OFFER_PROCESS}:${interaction.user.id}`, 69);

    const offer = await prisma.offer.findUnique({
      where: {
        messageId: interaction.message.id,
      },
    });

    if (!offer) {
      return await redis.del(`${Constants.redis.nypsi.OFFER_PROCESS}:${interaction.user.id}`);
    }

    await interaction.deferReply();

    const preferences = await getPreferences(interaction.user.id);

    preferences.offers = 0;

    await updatePreferences(interaction.user.id, preferences);

    return interaction.editReply({
      embeds: [new CustomEmbed(null, "✅ you will not receive anymore offers")],
    });
  },
} as InteractionHandler;
