import * as Cluster from "discord-hybrid-sharding";
import { Client, ClientOptions } from "discord.js";
import channelCreate from "../events/channelCreate";
import channelDelete from "../events/channelDelete";
import guildCreate from "../events/guildCreate";
import guildDelete from "../events/guildDelete";
import guildMemberAdd from "../events/guildMemberAdd";
import guildMemberRemove from "../events/guildMemberRemove";
import guildMemberUpdate from "../events/guildMemberUpdate";
import interactionCreate from "../events/interactionCreate";
import messageCreate from "../events/message";
import messageDelete from "../events/messageDelete";
import messageDeleteBulk from "../events/messageDeleteBulk";
import messageUpdate from "../events/messageUpdate";
import ready from "../events/ready";
import roleDelete from "../events/roleDelete";
import userUpdate from "../events/userUpdate";
import redis from "../init/redis";
import { runAuctionChecks } from "../scheduled/clusterjobs/checkauctions";
import { runLotteryInterval } from "../scheduled/clusterjobs/lottery";
import { runLogs, runModerationChecks } from "../scheduled/clusterjobs/moderationchecks";
import { runPremiumChecks } from "../scheduled/clusterjobs/premiumexpire";
import { runSurveyChecks } from "../scheduled/clusterjobs/surveyends";
import { runPremiumCrateInterval } from "../scheduled/clusterjobs/weeklycrates";
import { runWorkerInterval } from "../scheduled/clusterjobs/workers";
import { doChatReactions } from "../utils/functions/chatreactions/utils";
import { runEconomySetup } from "../utils/functions/economy/utils";
import { runChristmas } from "../utils/functions/guilds/christmas";
import { runCountdowns } from "../utils/functions/guilds/countdowns";
import { updateCounters } from "../utils/functions/guilds/counters";
import { runSnipeClearIntervals } from "../utils/functions/guilds/utils";
import { runUploadReset } from "../utils/functions/image";
import { runCommandUseTimers } from "../utils/handlers/commandhandler";
import { updateCache } from "../utils/handlers/imghandler";
import { getWebhooks, logger, setClusterId } from "../utils/logger";

export class NypsiClient extends Client {
  public cluster: Cluster.Client;

  constructor(options: ClientOptions) {
    super(options);

    this.cluster = new Cluster.Client(this);

    setClusterId(this.cluster.id);

    runEconomySetup();

    redis.del("${Constants.redis.nypsi.PRESENCE}");

    if (this.cluster.maintenance) {
      logger.info(`started on maintenance mode with ${this.cluster.maintenance}`);
    }

    return this;
  }

  public loadEvents() {
    this.on("shardReady", (shardID) => {
      logger.info(`shard#${shardID} ready`);
    });
    this.on("shardDisconnect", (s, shardID) => {
      logger.info(`shard#${shardID} disconnected`);
    });
    this.on("shardError", (error1, shardID) => {
      logger.error(`shard#${shardID} error: ${error1}`);
    });
    this.on("shardReconnecting", (shardID) => {
      logger.info(`shard#${shardID} connecting`);
    });
    this.on("shardResume", (shardId) => {
      logger.info(`shard#${shardId} resume`);
    });

    this.once("ready", ready.bind(null, this));

    this.cluster.on("message", (message) => {
      if (message._sRequest) {
        if (message.alive) message.reply({ alive: true });
      }
    });

    this.cluster.on("ready", async () => {
      await redis.del("${Constants.redis.nypsi.RESTART}");
      this.on("guildCreate", guildCreate.bind(null, this));
      this.on("guildDelete", guildDelete.bind(null, this));
      this.rest.on("rateLimited", (rate) => {
        const a = rate.route.split("/");
        const reason = a[a.length - 1];
        logger.warn("rate limit: " + reason);
      });
      this.on("guildMemberUpdate", guildMemberUpdate.bind(null));
      this.on("guildMemberAdd", guildMemberAdd.bind(null));
      this.on("guildMemberRemove", guildMemberRemove.bind(null));
      this.on("messageDelete", messageDelete.bind(null));
      this.on("messageUpdate", messageUpdate.bind(null));
      this.on("messageCreate", messageCreate.bind(null));
      this.on("messageDeleteBulk", messageDeleteBulk.bind(null));
      this.on("channelCreate", channelCreate.bind(null));
      this.on("channelDelete", channelDelete.bind(null));
      this.on("roleDelete", roleDelete.bind(null));
      this.on("userUpdate", userUpdate.bind(null));
      this.on("interactionCreate", interactionCreate.bind(null));

      setTimeout(() => {
        this.runIntervals();
      }, 60000);
    });
  }

  private runIntervals() {
    updateCache();
    getWebhooks(this);
    updateCounters(this);
    runCountdowns(this);
    runChristmas(this);
    runSnipeClearIntervals();
    doChatReactions(this);
    runCommandUseTimers(this);
    runUploadReset();

    if (this.cluster.id != 0) return;

    runLotteryInterval(this);
    runPremiumCrateInterval(this);
    runPremiumChecks(this);
    runModerationChecks(this);
    runAuctionChecks(this);
    runSurveyChecks(this);
    runLogs();
    runWorkerInterval();
  }
}
