import { composeFiatComparisonEmbed } from "./processor"
import { TextCommandResponse } from "types/common"
import { Message } from "discord.js"

async function run(
  msg: Message,
  base: string,
  target: string
): Promise<TextCommandResponse> {
  return await composeFiatComparisonEmbed(msg, base, target)
}
export default run
