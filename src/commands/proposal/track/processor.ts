import config from "adapters/config"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageOptions,
} from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { RunResult, MultipleResult } from "types/common"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"

export async function handle(
  msg: OriginalMessage,
  channel_id: string,
  snapshot_url: string,
  guild_id: string
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const { error, log, curl, ok } = await config.createDaoTrackerConfigs({
    guild_id,
    channel_id,
    snapshot_url,
  })
  if (error?.includes("proposal space id invalid")) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Can't find DAO/ Invalid link",
            description: `${getEmoji("REVOKE")} Invalid DAO Link\n${getEmoji(
              "POINTINGRIGHT"
            )} You can choose a DAO on [Snapshot](https://snapshot.org/#/) and copy its URL.\n${getEmoji(
              "POINTINGRIGHT"
            )} Then try again with \`$dv track #channel <snapshot_DAO_link>\`\n\n**Example:** \`$dv track #channel https://snapshot.org/#/bitdao.eth\``,
          }),
        ],
      },
    }
  }
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      description: log,
      error: "Make sure that you entered existing dao space or URL.",
      curl,
    })
  }
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully track proposals",
          description: `All the proposal voting rounds will be sent to <#${channel_id}>`,
        }),
      ],
    },
  }
}

export async function subscribeCommonwealthDiscussion(i: ButtonInteraction) {
  const [communityId, discussionIdStr] = i.customId.split("-").slice(1)
  const msg = i.message as Message
  await i.deferUpdate()
  if (msg.hasThread) {
    return
  }
  const thread = await msg.startThread({
    name: `discussion-${communityId}-${discussionIdStr}`,
    autoArchiveDuration: "MAX",
    reason: "Discussion thread for Commonwealth proposal thread",
  })
  const discussion_id = +discussionIdStr
  if (Number.isNaN(discussion_id)) {
    return
  }
  const { ok, error, log, curl } =
    await config.createDaoTrackerCommonwealthDiscussionSub({
      discord_thread_id: thread.id,
      discussion_id,
    })
  if (!ok) {
    await thread.delete("subscribe failed")
    throw new APIError({ error, curl, description: log })
  }
  await thread.send("Start subscribing thread's discussion!")
}
