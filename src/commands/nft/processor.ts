import community from "adapters/community"
import {
  EmbedFieldData,
  Message,
  MessageAttachment,
  MessageButton,
  MessageActionRow,
} from "discord.js"
import { APIError, InternalError } from "errors"
import {
  emojis,
  getCompactFormatedNumber,
  getEmoji,
  getEmojiURL,
  getMarketplaceCollectionUrl,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  justifyEmbedFields,
} from "ui/discord/embed"
import { CircleleStats, RectangleStats } from "types/canvas"
import { NFTCollection } from "types/community"
import { drawCircleImage, drawRectangle, loadImages } from "ui/canvas/draw"
import { Image, createCanvas } from "canvas"
import { widthOf } from "ui/canvas/calculator"
import { handleTextOverflow } from "ui/canvas/text"
import { ResponseIndexerPrice } from "types/api"

const buildDiscordMessage = (
  msg: Message | undefined,
  title: string,
  description: string,
  err = true
) => {
  if (err) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            title: title,
            description: description,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: title,
          description: description,
        }),
      ],
    },
  }
}

export async function callAPI(
  address: string,
  chainId: string,
  userId: string,
  guildId: string,
  msg: Message | undefined,
  priorityFlag: boolean
) {
  const respCollection = await community.addNftCollection({
    chain_id: chainId,
    address: address,
    author: userId,
    guild_id: guildId,
    message_id: msg?.id,
    channel_id: msg?.channelId,
    priority_flag: priorityFlag,
  })
  const respChain = await community.getSupportedChains()
  return { storeCollectionRes: respCollection, supportedChainsRes: respChain }
}

export async function toEmbed(
  storeCollectionRes: any,
  supportedChainsRes: any,
  msg?: Message | undefined
) {
  // get response and show discord message
  const { error } = storeCollectionRes
  const { data: chainData } = await supportedChainsRes
  switch (storeCollectionRes.status) {
    case 200:
      return buildDiscordMessage(
        msg,
        "NFT",
        "Successfully add new collection to queue",
        false
      )
    case 500:
      return buildDiscordMessage(msg, "NFT", "Internal Server Error")
    default:
      if (
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection name"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection name."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection symbol"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection symbol."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: no contract code at given address"
        )
      ) {
        throw new InternalError({
          msgOrInteraction: msg,
          title: "Can't find the NFT collection",
          description:
            "The NFT Address and NFT Chain must be valid. Go to the collection's official website/ marketplace to find this information. ",
        })
      } else if (error.includes("Already added. Nft is in sync progress")) {
        return buildDiscordMessage(
          msg,
          "Existing Collection",
          "Please add another one or view the collection by `$nft <collection_symbol> <token_id>`."
        )
      } else if (error.includes("block number not synced yet")) {
        return buildDiscordMessage(msg, "NFT", "Block number is not in sync.")
      } else if (error.includes("Already added. Nft is done with sync")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Already added. Nft is done with sync"
        )
      } else if (error.includes("chain is not supported/invalid")) {
        // add list chain to description
        const listChainSupportedPrefix = `List chain supported:\n`
        let listChainSupported = ""
        for (const chainItm of chainData) {
          listChainSupported = listChainSupported + `${chainItm}\n`
        }
        const listChainDescription =
          `Chain is not supported. ` +
          listChainSupportedPrefix +
          "```\n" +
          listChainSupported +
          "```"
        return buildDiscordMessage(msg, "NFT", listChainDescription)
      } else if (
        error.includes("duplicate key value violates unique constraint")
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection is already added"
        )
      } else if (error.includes("No metadata found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Cannot found metadata for this collection"
        )
      } else {
        return buildDiscordMessage(msg, "NFT", error)
      }
  }
}

export async function composeCollectionInfoEmbed(
  msg: Message,
  collectionAddress: string,
  chain: string
) {
  if (chain === "999" || chain === "sol") {
    collectionAddress = "solscan-" + collectionAddress
  }
  const { data, ok, curl, log } = await community.getNFTCollectionMetadata(
    collectionAddress,
    chain
  )
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, curl: curl, description: log })
  }
  if (!data) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }
  const symbol = `${data.symbol?.toUpperCase() ?? "-"}`
  const address = data.address
    ? `[\`${shortenHashOrAddress(
        data.address
      )}\`](${getMarketplaceCollectionUrl(data.address)})`
    : "-"
  const name = `${data.name ?? "-"}`
  const desc = `${data.description ?? "-"}`
  const discord = data.discord
    ? `[${getEmoji("discord")}](${data.discord})`
    : ""
  const twitter = data.twitter
    ? `[${getEmoji("twitter")}](${data.twitter})`
    : ""
  const website = data.website ? `[🌐](${data.website})` : ""
  let more = "-"
  if (discord || twitter || website) {
    more = `${discord} ${twitter} ${website}`
  }
  const ercFormat = `${data.erc_format ?? "-"}`
  const marketplaces = data.marketplaces?.length
    ? data.marketplaces.map((m: string) => getEmoji(m)).join(" ")
    : "-"

  const fields = [
    {
      name: "Symbol",
      value: symbol,
    },
    {
      name: "Address",
      value: address,
    },
    {
      name: "Chain",
      value: `${getEmoji(chain)}`,
    },
    {
      name: "Marketplace",
      value: marketplaces,
    },
    {
      name: "Format",
      value: ercFormat,
    },
    {
      name: "Find More",
      value: more,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = data.image ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(msg, {
    author: [`${name}`, collectionImage],
    description: desc,
    image: "attachment://chart.png",
    thumbnail: collectionImage,
  }).addFields(fields)

  const buttonRow = buildSwitchViewActionRow("info", {
    collectionAddress,
    chain,
  })
  return {
    messageOptions: {
      embeds: [justifyEmbedFields(embed, 3)],
      components: [buttonRow],
    },
  }
}

export async function composeCollectionSoulboundEmbed(
  msg: Message,
  collectionAddress: string,
  chain: string
) {
  const { data, ok, curl, log } = await community.getNFTCollectionMetadata(
    collectionAddress,
    chain
  )
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, curl: curl, description: log })
  }
  if (!data) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }

  const name = `${data.name ?? "-"}`
  const collectionImage = data.image ?? getEmojiURL(emojis["NFTS"])
  const desc = `
    SAN NFTs, after being minted can be traded for speculative investing, or “Soulbound”. Soulbinding locks the NFT to your specific wallet forever, which thereby creates a unique login identifier for the SAN Sound platform.\n
    The platform that the SAN ecosystem is centered around, “SAN Sound,” comprises a novel approach to the radio streaming model where subscribers must mint and, later, Soulbind their SAN NFT to gain login access.\n
    Additional access perks include entry to global SAN music events and limited-edition collectibles, such as audio hardware, physical art, and fashion apparel.
  `

  const embed = composeEmbedMessage(msg, {
    author: [`${name}`, collectionImage],
    description: desc,
    image:
      "https://cdn.discordapp.com/attachments/967480994481438780/1070602776276652062/1728de264e1c0237aca023dd0b98d688_1.jpg",
  })

  const buttonRow = buildSwitchViewActionRow("info", {
    collectionAddress,
    chain,
  })

  return {
    messageOptions: {
      embeds: [justifyEmbedFields(embed, 3)],
      components: [buttonRow],
    },
  }
}

// render canvas for nft list and nft recent
export async function renderSupportedNFTList(collectionList: NFTCollection[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 870,
    },
    y: {
      from: 0,
      to: 420,
    },
    w: 0,
    h: 0,
    pt: 0,
    pl: 30,
    radius: 30,
    bgColor: "rgba(0, 0, 0, 0)", // transparent
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")

  // background
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()
  ctx.restore()

  const fixedCollectionNameHeight = 24
  // const fixedChainNameHeight = 26
  const iconConfig = {
    w: 30,
    h: 30,
    mr: 20,
  }
  ctx.font = "27px Whitney"
  let columnY = container.pt ?? 0

  collectionList = collectionList
    .filter((col) => !!col.name)
    .map((col) => {
      col.image = col.image ? col.image : thumbnails.PROFILE
      return col
    })

  const images: Record<string, Image> = loadImages(
    collectionList.map((col) => col.image)
  )
  collectionList.forEach((item, idx) => {
    const colMaxWidth = 300
    const symbolName = item.symbol?.toUpperCase()
    const cName = item.name
    const symbolNameWidth = widthOf(ctx, symbolName)

    let collectionName: string
    if (symbolNameWidth < colMaxWidth) {
      const maxColNameWidth = colMaxWidth - symbolNameWidth
      collectionName =
        handleTextOverflow(ctx, cName, maxColNameWidth) +
        ` (${item.symbol?.toUpperCase()})`
    } else {
      collectionName =
        handleTextOverflow(ctx, cName, 80) +
        ` (${handleTextOverflow(ctx, item.symbol?.toUpperCase(), 200)})`
    }

    const xStart = idx % 2 === 0 ? container.x.from : 440
    const colConfig = {
      x: xStart + iconConfig.w + iconConfig.mr,
      y: container.pt,
      mr: 10,
      mb: 50,
    }

    // collection name
    if (idx % 2 === 0) {
      columnY +=
        fixedCollectionNameHeight +
        (iconConfig.h - fixedCollectionNameHeight) / 2 +
        20
    }

    const conf: CircleleStats = {
      x: xStart + 20,
      y: columnY - 10,
      radius: 20,
    }
    if (images[item.image]) {
      drawCircleImage({ ctx, stats: conf, image: images[item.image] })
    }

    ctx.font = "semibold 27px Whitney"
    ctx.fillStyle = "white"
    ctx.fillText(collectionName, colConfig.x, columnY)

    ctx.restore()
  })

  return new MessageAttachment(canvas.toBuffer(), "nftlist.png")
}

export function formatPriceWeiToEther(
  priceObj: ResponseIndexerPrice | undefined
) {
  if (!priceObj) return "-"
  const { amount, token } = priceObj
  const convertedAmount = Number(
    (+(amount ?? 0) / Math.pow(10, token?.decimals ?? 0)).toFixed(3)
  )
  if (!convertedAmount) return `-`
  return `${getCompactFormatedNumber(convertedAmount)}`
}

export function buildSwitchViewActionRow(
  currentView: string,
  params: {
    collectionAddress: string
    chain: string
    days?: number
  }
) {
  const { chain, days = 90 } = params
  let collectionAddress = params.collectionAddress

  if (collectionAddress.includes("solscan-")) {
    collectionAddress = collectionAddress.replace("solscan-", "")
  }
  const tickerButton = new MessageButton({
    label: "Ticker",
    emoji: getEmoji("INCREASING"),
    customId: `nft_ticker_view_chart-${collectionAddress}-${chain}-${days}`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const nftButton = new MessageButton({
    label: "Info",
    emoji: getEmoji("MAG"),
    customId: `nft_ticker_view_info-${collectionAddress}-${chain}-${days}`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  const row = new MessageActionRow()
  row.addComponents([tickerButton, nftButton])
  return row
}
