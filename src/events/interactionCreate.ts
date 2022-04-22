import { confirmAirdrop, enterAirdrop } from "commands/defi/airdrop"
import { SelectMenuInteraction, ButtonInteraction, Message } from "discord.js"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { Event } from "."

export default {
  name: "interactionCreate",
  once: false,
  execute: async (interaction: SelectMenuInteraction | ButtonInteraction) => {
    try {
      const msg = interaction.message as Message
      if (!interaction.isButton() || interaction.customId === "exit") {
        await handleSelecMenuInteraction(
          interaction as SelectMenuInteraction,
          msg
        )
        return
      }

      await handleButtonInteraction(interaction as ButtonInteraction, msg)
    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"interactionCreate">

async function handleSelecMenuInteraction(
  interaction: SelectMenuInteraction,
  msg: Message
) {
  const key = `${interaction.user.id}_${msg.guildId}_${msg.channelId}`
  const commandChoice = await CommandChoiceManager.get(key)
  if (!commandChoice) return
  if (interaction.customId === "exit") {
    await msg.delete().catch(() => {
      commandChoice.interaction
        ?.editReply({ content: "Exited!", components: [], embeds: [] })
        .catch(() => {})
    })
    CommandChoiceManager.remove(key)
    return
  }

  const { messageOptions, commandChoiceOptions } = await commandChoice.handler(
    interaction
  )
  await msg.edit(messageOptions)
  if (interaction) {
    const output = await interaction.deferUpdate({ fetchReply: true })
    await CommandChoiceManager.update(key, {
      ...commandChoiceOptions,
      interaction,
      messageId: output.id,
    })
  }
}

async function handleButtonInteraction(
  interaction: ButtonInteraction,
  msg: Message
) {
  const buttonInteraction = interaction as ButtonInteraction
  switch (true) {
    case interaction.customId === "cancel_airdrop":
      await msg.delete().catch(() => {})
      return
    case interaction.customId.startsWith("confirm_airdrop-"):
      await confirmAirdrop(buttonInteraction, msg)
      return
    case interaction.customId.startsWith("enter_airdrop-"):
      await enterAirdrop(buttonInteraction, msg)
      return
    default:
      return
  }
}
