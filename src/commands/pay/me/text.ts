import { getEmoji } from "utils/common"
import { parseMessageTip } from "commands/new-tip/index/processor"
import { Message } from "discord.js"
import { CommandArgumentError } from "errors"
import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { PAY_ME_GITBOOK, PREFIX } from "utils/constants"
import { parseTarget, run } from "./processor"

// DO NOT EDIT: if not anhnh
const cmd: Command = {
  id: "me",
  command: "me",
  brief: "Request others to make a payment",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const { valid, hasTarget, target, platform } = parseTarget(args[2])
    if (!valid) {
      throw new CommandArgumentError({
        message: msg,
        getHelpMessage: async () => this.getHelpMessage(msg),
      })
    }
    const [amount, token] = args.slice(hasTarget ? 3 : 2)
    const { messageTip: note } = await parseMessageTip(args)
    await run({
      msgOrInteraction: msg,
      amount: +amount,
      token: token.toUpperCase(),
      hasTarget,
      target,
      platform,
      note,
    })
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Payment",
        usage: `${PREFIX}pay me <amount> <token> [message]\n${PREFIX}pay me [username] <amount> <token> [message]`,
        examples: `${PREFIX}pay me 25 ftm “I want my money back”"\n${PREFIX}pay me @john 15 ftm “I want my money back”"`,
        description: `\`[username]\` can be one of the following:\n${getEmoji(
          "pointingright"
        )} Discord user name (eg: @John)\n${getEmoji(
          "pointingright"
        )} twitter:<Twitter user name> (eg: twitter:John)\n${getEmoji(
          "pointingright"
        )} tg:<Telegram user name> (eg: tg:John)\n${getEmoji(
          "pointingright"
        )} Email:<email address> (eg: email:John@gmail.com)`,
        document: PAY_ME_GITBOOK,
        includeCommandsList: false,
      }),
    ],
  }),
  colorType: "Wallet",
  canRunWithoutAction: true,
  allowDM: true,
  minArguments: 4,
}

export default cmd
