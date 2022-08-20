import { Client, Message, MessageEmbed, TextChannel } from "discord.js"
import { ALERT_CHANNEL_ID, LOG_CHANNEL_ID, MOCHI_GUILD_ID } from "env"
import { BotBaseError } from "errors"
import { logger } from "logger"
import { PREFIX } from "./constants"
import { getErrorEmbed } from "./discordEmbed"

export class ChannelLogger {
  logChannel: TextChannel = null
  private alertChannel: TextChannel

  ready(client: Client) {
    try {
      const guild = client.guilds.cache.get(MOCHI_GUILD_ID)
      if (guild) {
        this.alertChannel = guild.channels.cache.get(
          ALERT_CHANNEL_ID
        ) as TextChannel
        this.logChannel = guild.channels.cache.get(
          LOG_CHANNEL_ID
        ) as TextChannel
      }
    } catch (e: any) {
      logger.error(e)
    }
  }

  log(error: BotBaseError, funcName?: string) {
    if (this.logChannel) {
      if (funcName) {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(
            `\`\`\`bot crashed due to reason: ${funcName} ${error}\`\`\``
          )
        this.logChannel.send({
          embeds: [embed],
        })
      } else {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(`\`\`\`bot crashed due to reason: ${error}\`\`\``)
        this.logChannel.send({
          embeds: [embed],
        })
      }
    }
  }

  alert(msg: Message, error: BotBaseError) {
    if (!this.alertChannel || !msg.content.startsWith(PREFIX)) {
      return
    }
    const channel = msg.guild.channels.cache.get(msg.channelId)
    const description = `**Command:** \`${msg.content}\`\n**Guild:** \`${
      msg.guild.name
    }\`\n**Channel:** \`${channel?.name ?? msg.channelId}\`\n**Error:** \`\`\`${
      error?.message
    }\`\`\``
    const embed = getErrorEmbed({
      msg,
      title: "Command error",
      description,
    }).setTimestamp()
    this.alertChannel.send({ embeds: [embed] })
  }
}

export default new ChannelLogger()
