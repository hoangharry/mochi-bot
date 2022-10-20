import { Command } from "types/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import setChat from "./set-chat"
import remove from "./remove"

const actions: Record<string, Command> = {
  set,
  remove,
  list,
  "set-chat": setChat,
}

const command: Command = {
  id: "starboard",
  command: "starboard",
  brief: "Starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sb <action>`,
        footer: [`Type ${PREFIX}help sb <action> for a specific action!`],
        description: "Hornor and share well-rated posts with your community",
        examples: `${PREFIX}starboard list\n${PREFIX}sb list\n${PREFIX}starboard set 2 🌟 #starboard\n${PREFIX}sb set-chat 🌟 ❣️ #starboard`,
        includeCommandsList: true,
        document: STARBOARD_GITBOOK,
      }),
    ],
  }),
  aliases: ["sb"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
