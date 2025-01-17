import config from "adapters/config"
import { Channel } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { getMessageBody } from "../processor"
import TwitterStream from "listeners/twitter"

export const fromPrefix = "from:"
const hashtagPrefix = "#"
const handlePrefix = "@"
const channelPrefix = "<#"
const rolePrefix = "<@&"
const twitterAccountLinkPrefix = "https://twitter.com/"
const twitterAccountLinkRegex = new RegExp("https://twitter.com/(.+)")

const command: Command = {
  id: "poe_twitter_set",
  command: "set",
  brief: "Set a guild's Twitter PoE configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    const logChannelArg = args[3] ?? ""
    if (
      !logChannelArg.startsWith(channelPrefix) ||
      !logChannelArg.endsWith(">")
    ) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Invalid channel. Type # then choose the valid one!",
            }),
          ],
        },
      }
    }

    const logChannel = logChannelArg.substring(2, logChannelArg.length - 1)
    const chan: Channel | null = await msg.guild.channels
      .fetch(logChannel)
      .catch(() => null)
    if (!chan) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Channel not found" })],
        },
      }
    } else if (!chan.isText()) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({ msg, description: "Channel must be text-based" }),
          ],
        },
      }
    }

    let triggerKeywords = args[4]?.split(",") ?? []
    triggerKeywords = triggerKeywords.map((t) => t.trim())

    if (triggerKeywords.length === 0 || triggerKeywords.some((t) => !t)) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Empty keyword list" })],
        },
      }
    }

    for (const trigger of triggerKeywords) {
      if (
        [
          hashtagPrefix,
          handlePrefix,
          channelPrefix,
          rolePrefix,
          twitterAccountLinkPrefix,
          fromPrefix,
        ].every((prefix) => !trigger.startsWith(prefix))
      ) {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                msg,
                description:
                  "Invalid keyword format, run `$help poe twitter set` to see supported formats",
              }),
            ],
          },
        }
      }
    }

    // normalize hashtag that get treated as discord channels or
    // user handle that get treated as discord role
    triggerKeywords = await Promise.all(
      triggerKeywords.map(async (keyword) => {
        switch (true) {
          case keyword.startsWith(twitterAccountLinkPrefix) &&
            twitterAccountLinkRegex.test(keyword): {
            const handle = twitterAccountLinkRegex.exec(keyword)?.[1]
            return handlePrefix + handle
          }
          case keyword.startsWith(fromPrefix) &&
            twitterAccountLinkRegex.test(keyword.slice(fromPrefix.length)): {
            const handle = twitterAccountLinkRegex.exec(
              keyword.slice(fromPrefix.length)
            )?.[1]
            return fromPrefix + handle
          }
          case [channelPrefix, rolePrefix].some((p) => keyword.startsWith(p)) &&
            keyword.endsWith(">"): {
            if (keyword.startsWith(channelPrefix)) {
              const id = keyword.substring(2, keyword.length - 1)
              const chan = await msg.guild?.channels.fetch(id)
              return hashtagPrefix + chan?.name
            } else {
              const id = keyword.substring(3, keyword.length - 1)
              const role = await msg.guild?.roles.fetch(id)
              return handlePrefix + role?.name
            }
          }
          default:
            return keyword
        }
      })
    )

    const ruleId = await TwitterStream.upsertRule({
      ruleValue: triggerKeywords,
      channelId: chan.id,
      guildId: msg.guildId,
    })

    if (ruleId) {
      await config.setTwitterConfig({
        guild_id: msg.guildId,
        hashtag: triggerKeywords.filter((k) => k.startsWith(hashtagPrefix)),
        twitter_username: triggerKeywords.filter((k) =>
          k.startsWith(handlePrefix)
        ),
        from_twitter: triggerKeywords.filter((k) => k.startsWith(fromPrefix)),
        user_id: msg.author.id,
        channel_id: chan.id,
        rule_id: ruleId,
      })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Successfully set", getEmojiURL(emojis.APPROVE)],
            description: getMessageBody({
              user_id: msg.author.id,
              channel_id: chan.id,
              hashtag: triggerKeywords.filter((k) =>
                k.startsWith(hashtagPrefix)
              ),
              twitter_username: triggerKeywords.filter((k) =>
                k.startsWith(handlePrefix)
              ),
              from_twitter: triggerKeywords.filter((k) =>
                k.startsWith(fromPrefix)
              ),
            }),
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter set <channel> <keywords>`,
        examples: `${PREFIX}poe twitter set #general #mochitag,@Mochi Bot`,
        description: `\`<keywords>\` can be one of the following:\n\n1. \`#hashtag\`\n2. \`@twitter_username\`\n3. \`https://twitter.com/vincentz\`: same as (2) but in another way\n4. \`from:https://twitter.com/vincentz\`: watch every tweets from this user`,
        title: "Set config",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
}

export default command
