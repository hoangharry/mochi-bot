import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageOptions,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { MultipleResult, RunResult } from "types/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  justifyEmbedFields,
} from "ui/discord/embed"
import community from "adapters/community"
import {
  emojis,
  getCompactFormatedNumber,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
} from "utils/common"
import { renderChartImage, renderPlotChartImage } from "ui/canvas/chart"
import dayjs from "dayjs"
import { APIError } from "errors"
import {
  ResponseIndexerNFTCollectionTickersData,
  ResponseIndexerPrice,
} from "types/api"
import { InternalError } from "errors"
import config from "adapters/config"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getDefaultSetter } from "utils/default-setters"
import { getExitButton } from "ui/discord/button"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import {
  buildSwitchViewActionRow,
  composeCollectionInfoEmbed,
} from "../processor"

const dayOpts = [1, 7, 30, 60, 90, 365]
const decimals = (p?: ResponseIndexerPrice) => p?.token?.decimals ?? 0
let originAuthorId: string

export enum ChartStyle {
  Line = "LINE",
  Plot = "PLOT",
}

export function getOriginAuthorId() {
  return originAuthorId
}

export async function handleNFTTickerViews(interaction: ButtonInteraction) {
  const msg = <Message>interaction.message
  const [collectionAddress, chain, days] = interaction.customId
    .split("-")
    .slice(1)
  await interaction.deferUpdate().catch(() => null)
  if (interaction.user.id !== originAuthorId) {
    return
  }
  if (interaction.customId.startsWith("nft_ticker_view_chart")) {
    await viewTickerChart(msg, { collectionAddress, chain, days })
    return
  }
  await viewTickerInfo(msg, { collectionAddress, chain })
}

async function viewTickerChart(
  msg: Message,
  params: { collectionAddress: string; chain: string; days: string }
) {
  const { collectionAddress, chain, days } = params
  const { messageOptions } = await composeCollectionTickerEmbed({
    msg,
    collectionAddress,
    chain,
    ...(days && { days: +days }),
    chartStyle: ChartStyle.Plot,
  })
  await msg.edit(messageOptions)
}

async function viewTickerInfo(
  msg: Message,
  params: { collectionAddress: string; chain: string }
) {
  const { collectionAddress, chain } = params
  const { messageOptions } = await composeCollectionInfoEmbed(
    msg,
    collectionAddress,
    chain
  )
  await msg.edit(messageOptions)
  await msg.removeAttachments()
}

async function composeCollectionTickerEmbed({
  msg,
  collectionAddress,
  chain,
  days = 90,
  chartStyle,
}: {
  msg: Message | CommandInteraction
  collectionAddress: string
  chain: string
  days?: number
  chartStyle: ChartStyle
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  const { data, ok, log, curl } = await community.getNFTCollectionTickers({
    collectionAddress,
    from,
    to,
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, curl: curl, description: log })
  }
  // collection is not exist, mochi has not added it yet
  if (!data) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }

  const {
    items,
    owners,
    name,
    collection_image,
    total_volume,
    floor_price,
    last_sale_price,
    price_change_1d,
    price_change_7d,
    price_change_30d,
  } = data

  const floorPriceAmount = Number(
    (+(floor_price?.amount ?? 0) / Math.pow(10, decimals(floor_price))).toFixed(
      3
    )
  )
  const totalVolumeAmount = Number(
    (
      +(total_volume?.amount ?? 0) / Math.pow(10, decimals(floor_price))
    ).toFixed(3)
  )
  const lastSalePriceAmount = Number(
    (
      +(last_sale_price?.amount ?? 0) / Math.pow(10, decimals(last_sale_price))
    ).toFixed(3)
  )
  const priceToken = floor_price?.token?.symbol?.toUpperCase() ?? ""
  const marketcap = floorPriceAmount * (items ?? 0)
  const formatPrice = (amount: number) => {
    if (!amount) return `-`
    return `${getCompactFormatedNumber(amount)}`
  }
  const getChangePercentage = (changeStr: string | undefined) => {
    const change = changeStr ? +changeStr : 0
    const trend =
      change > 0
        ? getEmoji("INCREASING")
        : change === 0
        ? ""
        : getEmoji("DECREASING")
    return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
  }

  const fields = [
    {
      name: "Item",
      value: `${items}`,
    },
    ...(owners && owners > 0
      ? [
          {
            name: "Owner",
            value: `${owners}`,
          },
        ]
      : []),
    {
      name: `Market cap (${priceToken})`,
      value: formatPrice(marketcap),
    },
    {
      name: `Volume (${priceToken})`,
      value: formatPrice(totalVolumeAmount),
    },
    {
      name: `Floor price (${priceToken})`,
      value: `${formatPrice(floorPriceAmount)} ${getEmoji(priceToken)}`,
    },
    {
      name: `Last sale (${priceToken})`,
      value: `${formatPrice(lastSalePriceAmount)} ${getEmoji(priceToken)}`,
    },
    {
      name: "Change (24h)",
      value: getChangePercentage(price_change_1d),
    },
    {
      name: "Change (7d)",
      value: getChangePercentage(price_change_7d),
    },
    {
      name: "Change (1M)",
      value: getChangePercentage(price_change_30d),
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = collection_image ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(null, {
    author: [`${name}`, collectionImage],
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderNftTickerChart({ data, chartStyle })
  const selectRow = composeDaysSelectMenu(
    "nft_ticker_selection",
    collectionAddress,
    dayOpts,
    90
  )
  const buttonRow = buildSwitchViewActionRow("ticker", {
    collectionAddress,
    days: days ?? 7,
    chain,
  }).addComponents(getExitButton(originAuthorId))
  return {
    messageOptions: {
      files: chart ? [chart] : [],
      embeds: [justifyEmbedFields(embed, 3)],
      components: [selectRow, buttonRow],
    },
    interactionOptions: {
      handler: handler(chartStyle),
    },
  }
}

async function renderNftTickerChart({
  collectionAddress,
  days = 90,
  data,
  chartStyle,
}: {
  collectionAddress?: string
  days?: number
  data?: ResponseIndexerNFTCollectionTickersData
  chartStyle: ChartStyle
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  if (!data && collectionAddress) {
    const res = await community.getNFTCollectionTickers({
      collectionAddress,
      from,
      to,
    })
    if (!res.ok) {
      return null
    }
    data = res.data
  }
  if (!data?.tickers?.prices || !data?.tickers.times) {
    return null
  }
  const token = data.floor_price?.token?.symbol ?? ""
  const fromLabel = dayjs(from).format("MMMM DD, YYYY")
  const toLabel = dayjs(to).format("MMMM DD, YYYY")
  let chart: Buffer
  switch (chartStyle) {
    case ChartStyle.Line: {
      const chartData = data.tickers.prices.map(
        (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p))
      )
      chart = await renderChartImage({
        chartLabel: `Floor price (${token}) | ${fromLabel} - ${toLabel}`,
        labels: data.tickers.times,
        data: chartData,
      })
      break
    }
    case ChartStyle.Plot: {
      const prices = data.tickers.prices.map(
        (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p))
      )
      const times = data.tickers.timestamps ?? []
      let plotChartData: { x: number; y: number }[]
      if (prices.length < times.length) {
        plotChartData = prices.map((value, index) => {
          return {
            x: times[index],
            y: value,
          }
        })
      } else {
        plotChartData = times.map((value, index) => {
          return {
            x: value,
            y: prices[index],
          }
        })
      }
      chart = await renderPlotChartImage({
        chartLabel: `Floor price (${token}) | ${fromLabel} - ${toLabel}`,
        data: plotChartData,
      })
      break
    }
  }
  return new MessageAttachment(chart, "chart.png")
}

const handler: (chartStyle: ChartStyle) => InteractionHandler =
  (chartStyle) => async (msgOrInteraction) => {
    const interaction = msgOrInteraction as SelectMenuInteraction
    await interaction.deferUpdate().catch(() => null)
    if (interaction.user.id !== originAuthorId) {
      return {
        messageOptions: {},
      }
    }
    const { message } = <{ message: Message }>interaction
    const input = interaction.values[0]
    const [collectionAddress, days] = input.split("_")

    const chart = await renderNftTickerChart({
      collectionAddress,
      days: +days,
      chartStyle: chartStyle,
    })

    // update chart image
    const [embed] = message.embeds
    await message.removeAttachments()
    embed.setImage("attachment://chart.png")

    const selectMenu = message.components[0].components[0] as MessageSelectMenu
    selectMenu.options.forEach(
      (opt, i) => (opt.default = i === dayOpts.indexOf(+days))
    )
    // this code block stores current day selection
    message.components[1].components.forEach((b) => {
      const customId = b.customId
      if (!customId?.startsWith("nft_ticker_view")) return
      const params = customId?.split("-")
      params[3] = days
      b.customId = params.join("-")
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: chart ? [chart] : [],
        components: message.components as MessageActionRow[],
      },
      interactionHandlerOptions: {
        handler: handler(chartStyle),
      },
    }
  }

export async function handleNftTicker(
  msg: Message | CommandInteraction,
  symbol: string,
  authorId: string,
  chartStyle: ChartStyle
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  originAuthorId = authorId

  const {
    data: suggestions,
    ok,
    log,
    curl,
  } = await community.getNFTCollectionSuggestions(symbol)
  if (!ok) throw new APIError({ msgOrInteraction: msg, curl, description: log })
  if (!suggestions.length) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Collection not found",
            description: `The collection hasn't been supported.\n${getEmoji(
              "POINTINGRIGHT"
            )} Please choose one in the supported \`$nft list\`.\n${getEmoji(
              "POINTINGRIGHT"
            )} To add your NFT, run \`$nft add\`.`,
          }),
        ],
      },
    }
  }
  if (suggestions.length === 1) {
    return await composeCollectionTickerEmbed({
      msg,
      collectionAddress: suggestions[0].address ?? "",
      chain: suggestions[0].chain ?? "",
      chartStyle,
    })
  }

  // if default ticker was set then respond
  const getDefaultRes = await config.getGuildDefaultNFTTicker({
    guild_id: msg.guildId ?? "",
    query: symbol,
  })
  if (
    getDefaultRes.ok &&
    getDefaultRes.data.address &&
    getDefaultRes.data.chain_id
  ) {
    const { address, chain_id } = getDefaultRes.data
    return await composeCollectionTickerEmbed({
      msg,
      collectionAddress: address,
      chain: chain_id,
      chartStyle,
    })
  }

  const options = suggestions.flatMap((s: any) => {
    const valueMaxLength = 100
    const value = `${symbol}_${s.name}_${s.symbol}_${s.address}_${s.chain}_${s.chain_id}`
    if (value.length > valueMaxLength) return []
    return {
      label: `${s.name} (${s.symbol})`,
      value,
    }
  })

  if (!options.length) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Collection not found",
            description:
              "The collection is not supported yet. Please contact us for the support. Thank you!",
          }),
        ],
      },
    }
  }

  // render embed to show multiple results
  return {
    select: {
      options,
      placeholder: "Select a ticker",
    },
    onDefaultSet: async (i) => {
      const [query, name, symbol, collectionAddress, chainId] =
        i.customId.split("_")
      getDefaultSetter({
        updateAPI: config.setGuildDefaultNFTTicker.bind(config, {
          guild_id: i.guildId ?? "",
          query,
          symbol,
          collection_address: collectionAddress,
          chain_id: +chainId,
        }),
        description: `Next time your server members use \`$nft ticker\` with \`${symbol}\`, **${name}** will be the default selection`,
      })(i)
    },
    render: ({ msgOrInteraction: msg, value }) => {
      const [, , , collectionAddress, chain] = value.split("_")
      return composeCollectionTickerEmbed({
        msg,
        collectionAddress,
        chain,
        chartStyle,
      })
    },
    ambiguousResultText: symbol.toUpperCase(),
    multipleResultText: suggestions
      .map((s) => `**${s.name}** (${s.symbol})`)
      .join(", "),
  }
}
