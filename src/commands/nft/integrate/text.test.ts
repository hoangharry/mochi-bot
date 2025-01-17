import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import nft from ".."

describe("nft integrate", () => {
  let msg: Message
  const commandAction = "integrate"
  if (
    !nft.textCmd ||
    !nft.textCmd.actions ||
    !nft.textCmd.actions[commandAction]
  )
    return
  const nftCmd = nft.textCmd.actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("nft add address chain", async () => {
    msg.content = `$nft integrate 0x12345612345 ftm`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "ABC integrated",
            description:
              "ABC collection is now ready to take part in our verse (added + enabled)",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftIntegrateCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft integrated failed", async () => {
    msg.content = `$nft integrate 0x12345612345 sol`
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Cannot found metadata for this collection",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftIntegrateCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
