import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class InsufficientBalanceError extends BotBaseError {
  private error: string

  constructor({
    discordId,
    message,
    error,
  }: {
    discordId: string
    message: OriginalMessage
    error: string
  }) {
    super(message)
    this.name = "Insufficient funds error"
    this.error = error
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { discordId },
    })
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: "Insufficient funds",
          description: this.error,
        }),
      ],
    })
  }
}