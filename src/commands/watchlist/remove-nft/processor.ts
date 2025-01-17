import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { Message, CommandInteraction } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"
import { handleUpdateWlError } from "../processor"

export const removeWatchlistNftCollection = async ({
  msgOrInteraction,
  userId,
  symbol,
}: {
  msgOrInteraction: Message | CommandInteraction
  userId: string
  symbol: string
}) => {
  const { ok, error } = await defi.removeNFTFromWatchlist({
    userId,
    symbol,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error, true)
  CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully remove!",
          description: `**${symbol.toUpperCase()}** has been removed from your watchlist successfully!`,
        }),
      ],
    },
  }
}
