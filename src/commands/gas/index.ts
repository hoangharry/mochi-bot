import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { GAS_ESTIMATION_GITBOOK, PREFIX } from "utils/constants"
import { getEmoji } from "utils/common"
import gas from "./index/text"
import gasSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "gas",
  command: "gas",
  brief: "Gas Tracker",
  category: "Defi",
  run: gas,
  featured: {
    title: `${getEmoji("exp")} Gas Prices`,
    description: "Display gas price on many networks",
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}gas\n${PREFIX}gas eth`,
          usage: `${PREFIX}gas [network]`,
          description:
            "Display the estimated gas price for on-chain transactions on many networks.",
          footer: [`Type ${PREFIX}gas to check gas price`],
          document: GAS_ESTIMATION_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
}

const slashCmd: SlashCommand = {
  name: "gas",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("gas")
      .setDescription("Gas Tracker")
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("gas price of many networks")
          .setRequired(false)
      )
    return data
  },
  run: gasSlash,
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
