import {
  ButtonInteraction,
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { embedsColors } from "types/common"
import { HOMEPAGE_URL } from "utils/constants"

export async function sendVerifyURL(interaction: ButtonInteraction) {
  if (!interaction.member || !interaction.guildId) return
  await interaction.deferReply({ ephemeral: true })
  const embed = new MessageEmbed()
    .setColor(embedsColors.Profile as ColorResolvable)
    .setTitle("Verify your wallet address")
    .setDescription(
      `Please verify your wallet address by clicking the button below.`
    )
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Verify")
      .setStyle("LINK")
      .setURL(
        `${HOMEPAGE_URL}/verify?code=${Date.now()}&did=${interaction.user.id}`
      )
  )
  await interaction
    .editReply({ embeds: [embed], components: [row] })
    .catch(() => null)
}
