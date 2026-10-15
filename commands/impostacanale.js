import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { setTargetChannel } from '../services/monitor.js';

export const data = new SlashCommandBuilder()
  .setName('impostacanale')
  .setDescription('Imposta questo canale testuale come canale per le notifiche del server Cobblemon.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  const channel = interaction.channel;

  if (!channel || !channel.isTextBased()) {
    return await interaction.reply({
      content: '[-] Questo comando può essere eseguito solo all\'interno di un canale testuale.',
      ephemeral: true
    });
  }

  setTargetChannel(channel.id);

  const embed = new EmbedBuilder()
    .setTitle('[✓] Canale Notifiche Configurato')
    .setColor(0x2ecc71)
    .setDescription(`D'ora in poi invierò in questo canale (<#${channel.id}>) tutti gli avvisi su:\n• [●] **Server Aperto**\n• [○] **Server Chiuso**\n• [►] **Cambi di Host**`)
    .setFooter({ text: 'Cobblemon Server Monitor' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
