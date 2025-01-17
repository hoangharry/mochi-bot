import * as processor from "./processor"
import CacheManager from "cache/node-cache"
import { assertDescription } from "../../../../tests/assertions/discord"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { defaultEmojis } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"

describe("composeSlashTokenWatchlist", () => {
  const interaction = mockdc.cloneCommandInteraction()

  afterEach(() => jest.clearAllMocks())

  test("run successfully with no items in watchlist", async () => {
    CacheManager.get = jest.fn().mockResolvedValueOnce({
      data: [],
      ok: true,
      curl: "",
      log: "",
    })
    const output = await processor.composeSlashTokenWatchlist(
      interaction,
      0,
      interaction.user.id
    )
    const expected = composeEmbedMessage2(interaction, {
      author: [`${interaction.user.username}'s watchlist`, undefined],
    })
    expected.setDescription(
      `No items in your watchlist.Run \`${PREFIX}watchlist add\` to add one.`
    )
    assertDescription(
      {
        messageOptions: output,
      },
      expected
    )
  })

  test("run successfully with items in watchlist", async () => {
    const res = {
      data: [
        {
          symbol: "eth",
          current_price: 0.1,
          sparkline_in_7d: {
            price: [0.1, 0.2],
          },
          price_change_percentage_7d_in_currency: 0.2,
          is_pair: true,
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.composeSlashTokenWatchlist(
      interaction,
      0,
      interaction.user.id
    )
    const expected = composeEmbedMessage2(interaction, {
      author: [`${interaction.user.username}'s watchlist`, undefined],
    })
    expected.setImage("attachment://watchlist.png")
    expect(output.embeds[0].image?.url === "attachment://watchlist.png")
  })
})

describe("composeSlashNFTWatchlist", () => {
  const interaction = mockdc.cloneCommandInteraction()

  afterEach(() => jest.clearAllMocks())

  test("run successfully with no items in watchlist", async () => {
    CacheManager.get = jest.fn().mockResolvedValueOnce({
      data: [],
      ok: true,
      curl: "",
      log: "",
    })
    const output = await processor.composeSlashTokenWatchlist(
      interaction,
      0,
      interaction.user.id
    )
    const expected = composeEmbedMessage2(interaction, {
      author: [`${interaction.user.username}'s watchlist`, undefined],
    })
    expected.setDescription(
      `No items in your watchlist.Run \`${PREFIX}watchlist add\` to add one.`
    )
    assertDescription(
      {
        messageOptions: output,
      },
      expected
    )
  })

  test("run successfully with items in watchlist", async () => {
    const res = {
      data: [
        {
          symbol: "rabby",
          current_price: 0.1,
          sparkline_in_7d: {
            price: [0.1, 0.2],
          },
          price_change_percentage_7d_in_currency: 0.2,
          is_pair: true,
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.composeSlashTokenWatchlist(
      interaction,
      0,
      interaction.user.id
    )
    const expected = composeEmbedMessage2(interaction, {
      author: [`${interaction.user.username}'s watchlist`, undefined],
    })
    expected.setImage("attachment://watchlist.png")
    expect(output.embeds[0].image?.url === "attachment://watchlist.png")
  })
})

describe("composeTokenWatchlist", () => {
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("run successfully with no items in watchlist", async () => {
    CacheManager.get = jest.fn().mockResolvedValueOnce({
      data: [],
      ok: true,
      curl: "",
      log: "",
    })
    const output = await processor.composeTokenWatchlist(msg, 0, msg.author.id)
    const expected = composeEmbedMessage(msg, {
      author: [
        `${msg.author.username}'s watchlist`,
        msg.author.displayAvatarURL({ format: "png" }),
      ],
      description: `_All information are supported by Coingecko_\n\n${defaultEmojis.POINT_RIGHT} Choose a token supported by [Coingecko](https://www.coingecko.com/) to add to the list.\n${defaultEmojis.POINT_RIGHT} Add token to track by \`$wl add <symbol>\`.`,
    })
    expected.setDescription(
      `No items in your watchlist.Run \`${PREFIX}wl add\` to add one.`
    )
    assertDescription(
      {
        messageOptions: output,
      },
      expected
    )
  })

  test("run successfully with items in watchlist", async () => {
    const res = {
      data: [
        {
          symbol: "eth",
          current_price: 0.1,
          sparkline_in_7d: {
            price: [0.1, 0.2],
          },
          price_change_percentage_7d_in_currency: 0.2,
          is_pair: true,
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.composeTokenWatchlist(msg, 0, msg.author.id)
    const expected = composeEmbedMessage(msg, {
      author: [
        `${msg.author.username}'s watchlist`,
        msg.author.displayAvatarURL({ format: "png" }),
      ],
      description: `_All information are supported by Coingecko_\n\n${defaultEmojis.POINT_RIGHT} Choose a token supported by [Coingecko](https://www.coingecko.com/) to add to the list.\n${defaultEmojis.POINT_RIGHT} Add token to track by \`$wl add <symbol>\`.`,
    })
    expected.setImage("attachment://watchlist.png")
    expect(output.embeds[0].image?.url === "attachment://watchlist.png")
  })
})
