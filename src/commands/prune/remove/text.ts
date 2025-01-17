import { Message } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { deleteWhitelist } from "./processor"

const command: Command = {
  id: "prune_remove",
  command: "remove",
  brief: "Remove a role from the safelist",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isRole, value: id } = parseDiscordToken(args[2])
    if (!isRole) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Command error",
        description:
          "Invalid role. Be careful not to be mistaken role with username while using `@`.",
      })
    }

    await deleteWhitelist(id, msg)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully removed!",
            description: `<@&${id}> is no longer safelisted.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune remove <role>`,
        examples: `${PREFIX}prune remove @Mochi`,
        description: `Remove a role from the safelist`,
        document: `${PRUNE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
  minArguments: 3,
}

export default command
