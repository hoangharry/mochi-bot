import Discord from "discord.js"
import { getSuccessEmbed } from "utils/discordEmbed"
import defi from "adapters/defi"
import { mockClient } from "../../../../tests/mocks"
import { CommandError } from "errors"
import { commands } from "commands"

jest.mock("adapters/defi")
const commandKey = "watchlist"
const commandAction = "remove"

describe("watchlist_remove", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist remove eth",
      author: {
        id: userId,
        username: "tester",
        discriminator: 1234,
      },
      id: Discord.SnowflakeUtil.generate(),
    },
    Reflect.construct(Discord.TextChannel, [
      guild,
      {
        client: mockClient,
        guild: guild,
        id: Discord.SnowflakeUtil.generate(),
      },
    ]),
  ])

  if (!commands[commandKey] || !commands[commandKey].actions) return
  const command = commands[commandKey].actions[commandAction]

  test("success", async () => {
    const res = {
      ok: true,
      data: {},
      error: null,
    }
    defi.removeFromWatchlist = jest.fn().mockResolvedValueOnce(res)

    const output = await command.run(msg)
    const expected = getSuccessEmbed({
      title: "Successfully remove!",
      description: `Token has been deleted successfully!`,
    })

    expect(defi.removeFromWatchlist).toHaveBeenCalled()
    expect(defi.removeFromWatchlist).toHaveBeenCalledWith({
      userId,
      symbol: "eth",
    })
    expect(expected.title).toStrictEqual(
      output?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      output?.messageOptions?.embeds?.[0].description
    )
  })

  test("fail", async () => {
    const res = {
      ok: false,
      data: null,
      error: "error",
    }
    defi.removeFromWatchlist = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.removeFromWatchlist).toHaveBeenCalled()
      expect(e).toBeInstanceOf(CommandError)
    }
  })
})