import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { checkAllHosts } from '../services/minecraft.js';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Controlla lo stato dettagliato di entrambi gli host (Angy e Rick).');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const allHosts = await checkAllHosts();

    const embed = new EmbedBuilder()
      .setTitle('📊 Cobblemon - Stato Server')
      .setColor(0x9b59b6)
      .setDescription('Stato in tempo reale delle due postazioni di host:')
      .setTimestamp()
      .setFooter({ text: 'Cobblemon Server Monitor' });

    for (const h of allHosts) {
      if (h.online) {
        embed.addFields({
          name: `🟢 ${h.name} - ONLINE`,
          value: `• **IP**: \`${h.host}:${h.port}\`\n• **Giocatori**: ${h.playersOnline}/${h.playersMax}\n• **Ping**: ${h.latency ?? 'N/D'} ms\n• **Versione**: ${h.version}`,
          inline: false
        });
      } else {
        embed.addFields({
          name: `🔴 ${h.name} - OFFLINE`,
          value: `• **IP**: \`${h.host}:${h.port}\`\n• *Server non raggiungibile*`,
          inline: false
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[Command status] Errore:', error);
    await interaction.editReply({
      content: `❌ Si è verificato un errore durante il controllo dello stato: \`${error.message}\``
    });
  }
}
