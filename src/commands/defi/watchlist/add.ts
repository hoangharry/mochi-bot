import { Command } from "types/common"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { defaultEmojis, thumbnails } from "utils/common"
import {
  composeDiscordSelectionRow,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage,
} from "utils/discordEmbed"
import { Coin } from "types/defi"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"
import { InteractionHandler } from "utils/InteractionManager"

export async function addToWatchlist(interaction: ButtonInteraction) {
  // deferUpdate because we will edit the message later
  if (!interaction.deferred) {
    interaction.deferUpdate()
  }
  const msg = interaction.message as Message
  const [coinId, symbol] = interaction.customId.split("|").slice(1)
  await addUserWatchlist(msg, interaction.user.id, symbol, coinId)

  // disable + change the label of the add button
  const addButton = interaction.message.components?.at(1)?.components.at(2)
  if (
    addButton?.type === "BUTTON" &&
    addButton.customId?.startsWith("ticker_add_wl")
  ) {
    addButton.setDisabled(true)
    addButton.setLabel("Added to watchlist")

    msg.components?.at(1)?.components.splice(2, 1, addButton)
    msg.edit({
      components: msg.components,
    })
  }
}

export async function addUserWatchlist(
  msgOrInteraction: Message | MessageComponentInteraction | CommandInteraction,
  userId: string,
  symbol: string,
  coinId = ""
) {
  const { data, ok, error } = await defi.addToWatchlist({
    user_id: userId,
    symbol,
    coin_gecko_id: coinId,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  return data
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const value = interaction.values[0]
  const [symbol, coinGeckoId, userId] = value.split("_")
  await addUserWatchlist(msgOrInteraction, userId, symbol, coinGeckoId)
  return {
    messageOptions: {
      embeds: [getSuccessEmbed({})],
      components: [],
    },
  }
}

const command: Command = {
  id: "watchlist_add",
  command: "add",
  brief: "Add a token to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    const data = await addUserWatchlist(msg, userId, symbol)
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              title: "Successfully set!",
              description: `Token has been added successfully!`,
            }),
          ],
        },
      }
    }

    // allow selection
    const { base_suggestions, target_suggestions } = data
    let options: MessageSelectOptionData[]
    if (!target_suggestions) {
      const opt = (coin: Coin): MessageSelectOptionData => ({
        label: `${coin.name}`,
        value: `${coin.symbol}_${coin.id}_${msg.author.id}`,
      })
      options = base_suggestions.map((b: Coin) => opt(b))
    } else {
      const opt = (base: Coin, target: Coin): MessageSelectOptionData => ({
        label: `${base.name} / ${target.name}`,
        value: `${base.symbol}/${target.symbol}_${base.id}/${target.id}_${msg.author.id}`,
      })
      options = base_suggestions
        .map((b: Coin) => target_suggestions.map((t: Coin) => opt(b, t)))
        .flat()
        .slice(0, 25) // discord allow maximum 25 options
    }
    const selectRow = composeDiscordSelectionRow({
      customId: "watchlist_selection",
      placeholder: "Make a selection",
      options,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.MAG} Multiple options found`,
            description: `Multiple tokens found for \`${symbol}\`.\nPlease select one of the following`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(msg.author.id)],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Add a token to your watchlist.",
        usage: `${PREFIX}watchlist add <symbol>`,
        examples: `${PREFIX}watchlist add eth`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
