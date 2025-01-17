import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runCreateVault } from "./processor"

const command: SlashCommand = {
  name: "new",
  category: "Config",
  prepare: () => {
    const choices = ["50", "66", "75", "100"]
    return new SlashCommandSubcommandBuilder()
      .setName("new")
      .setDescription("Set vault for guild")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription(
            "Name of the vault. This name will be used to identify the vault"
          )
          .setRequired(true)
      )
      .addStringOption((option) => {
        const o = option
          .setName("threshold")
          .setDescription("Threshold for vault")
          .setRequired(true)
        choices.forEach((choice) => o.addChoice(choice + "%", choice))
        return o
      })
  },
  run: async function (interaction: CommandInteraction) {
    return runCreateVault({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault create <name> <threshold>`,
        examples: `${SLASH_PREFIX}vault create test 50`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
