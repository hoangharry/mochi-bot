import { SlashCommandBuilder } from "@discordjs/builders"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, thumbnails } from "utils/common"
import {
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SLASH_PREFIX,
  TIP_GITBOOK,
} from "utils/constants"
import tipSlash from "./index/slash"
import tip from "./index/text"

const getHelpMessage = async (isSLash?: boolean) => {
  const prefix = isSLash ? SLASH_PREFIX : PREFIX
  const pointingright = getEmoji("pointingright")
  return {
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TIP,
        usage: `${prefix}tip <recipient(s)> <amount> <token> [each]\n${prefix}tip <recipient(s)> <amount> <token> [each] ["message"] [--onchain]`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value: `${pointingright} Username(s): \`@minh\`, \`@tom\`\n${pointingright} Role(s): \`@Staff\`, \`@Dev\`\n${pointingright} #Text_channel: \`#mochi\`, \`#channel\`\n${pointingright} In voice channel: mention “\`in voice channel\`” to tip members currently in\n${pointingright} Online status: add the active status “\`online\`” before mentioning recipients`,
        },
        {
          name: "Tip with token:",
          value: `${pointingright} Tip by the cryptocurrencies, choose one in the \`$token list\`.\n${pointingright} To tip by moniker, choose one in the \`$moniker list\`.`,
        },
        {
          name: "**Examples**",
          value: `\`\`\`${prefix}tip @John 10 ftm\n${prefix}tip @John @Hank all ftm\n${prefix}tip @RandomRole 10 ftm\n${PREFIX}tip @role1 @role2 1 ftm each\n${prefix}tip in voice channel 1 ftm each\n${prefix}tip online #mochi 1 ftm\n${prefix}tip @John 1 ftm "Thank you"\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
        }
      ),
    ],
  }
}

const textCmd: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: tip,
  featured: {
    title: `${getEmoji("tip")} Tip`,
    description: "Send coins to a user or a group of users",
  },
  getHelpMessage: () => getHelpMessage(),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

const slashCmd: SlashCommand = {
  name: "tip",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("tip")
      .setDescription("Send coins to a user or a group of users")
      .addStringOption((option) =>
        option
          .setName("users")
          .setDescription("users or role you want to tip. Example: @John")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of coins you want to send. Example: 5")
          .setMinValue(0)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: FTM")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("each")
          .setDescription(
            "true if amount is for each recipients, false if amount is divided equally"
          )
      )
      .addStringOption((option) =>
        option.setName("message").setDescription("message when tip recipients")
      )
  },
  run: tipSlash,
  help: () => getHelpMessage(true),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
