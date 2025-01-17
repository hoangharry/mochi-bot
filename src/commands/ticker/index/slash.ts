import config from "adapters/config"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError } from "errors"
import { SlashCommandResponse } from "types/common"
import { getEmoji } from "utils/common"
import { getDefaultSetter } from "utils/default-setters"
import { composeTickerResponse } from "./processor"

async function run(
  interaction: CommandInteraction,
  baseQ: string
): Promise<SlashCommandResponse> {
  const {
    ok,
    data: coins,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${baseQ}`,
    call: () => defi.searchCoins(baseQ),
  })
  if (!ok)
    throw new APIError({
      msgOrInteraction: interaction,
      description: log,
      curl,
    })
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction: interaction,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "POINTINGRIGHT"
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "POINTINGRIGHT"
      )} or Please choose a valid fiat currency.`,
    })
  }

  if (coins.length === 1) {
    return await composeTickerResponse({
      coinId: coins[0].id,
      discordId: interaction.user.id,
      symbol: baseQ,
    })
  }

  // if default ticket was set then respond...
  const { symbol } = coins[0]
  const defaultTicker = await CacheManager.get({
    pool: "ticker",
    key: `ticker-default-${interaction.guildId}-${symbol}`,
    call: () =>
      config.getGuildDefaultTicker({
        guild_id: interaction.guildId ?? "",
        query: symbol,
      }),
  })
  if (defaultTicker.ok && defaultTicker.data.default_ticker) {
    return await composeTickerResponse({
      coinId: defaultTicker.data.default_ticker,
      discordId: interaction.user.id,
      symbol: baseQ,
    })
  }

  return {
    select: {
      options: Object.values(coins).map((coin: any) => {
        return {
          label: `${coin.name} (${coin.symbol.toUpperCase()})`,
          value: `${coin.id}_${coin.symbol}_${coin.name}`,
        }
      }),
      placeholder: "Select a token",
    },
    onDefaultSet: async (i) => {
      const [coinId, symbol, name] = i.customId.split("_")
      getDefaultSetter({
        updateAPI: config.setGuildDefaultTicker.bind(config, {
          guild_id: i.guildId ?? "",
          query: symbol,
          default_ticker: coinId,
        }),
        updateCache: CacheManager.findAndRemove.bind(
          CacheManager,
          "ticker",
          `ticker-default-${i.guildId}-${symbol}`
        ),
        description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection`,
      })(i)
    },
    render: ({ msgOrInteraction: interaction, value }) => {
      const [coinId] = value.split("_")
      return composeTickerResponse({
        coinId,
        discordId: interaction.user.id,
        symbol: baseQ,
      })
    },
    ambiguousResultText: baseQ.toUpperCase(),
    multipleResultText: Object.values(coins)
      .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
      .join(", "),
  }
}

export default run
