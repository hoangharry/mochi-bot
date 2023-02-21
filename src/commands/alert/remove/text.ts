import Defi from "adapters/defi"
import { MessageSelectOptionData } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handler } from "./processor"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { APIError } from "errors"

const command: Command = {
  id: "alert_remove",
  command: "remove",
  brief: "Remove the price alert",
  category: "Defi",
  run: async function (msg) {
    const { ok, data, log, curl } = await Defi.getAlertList(msg.author.id)
    if (!ok) {
      throw new APIError({ message: msg, description: log, curl })
    }

    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "No alert found",
              description: `You haven't set up any alert. To set up a new alert, you can use \`$alert add <token_symbol>\`.`,
            }),
          ],
        },
      }
    }

    const options: MessageSelectOptionData[] = []
    data.forEach((alert: any) => {
      options.push({
        label:
          alert.symbol +
            " " +
            alert.alert_type.replaceAll("_", " ") +
            " " +
            alert.price ?? "",
        value: `${alert.user_discord_id ?? ""}|${alert.symbol ?? ""}|${
          alert.price ?? ""
        }`,
      })
    })

    const embed = composeEmbedMessage(msg, {
      title: "Select an alert to remove",
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "alert_remove",
            placeholder: "Select an alert",
            options,
          }),
          composeDiscordExitButton(msg.author.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}alert remove`,
        examples: `${PREFIX}alert remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command