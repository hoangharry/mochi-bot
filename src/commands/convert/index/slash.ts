import { render } from "./processor"
import { CommandInteraction } from "discord.js"

const run = async (i: CommandInteraction) => {
  const amount = i.options.getString("amount", true)
  const from = i.options.getString("from", true)
  const to = i.options.getString("to", true)

  const args = ["convert", amount, from, to].filter((s) => Boolean(s))
  return await render(i, args)
}
export default run