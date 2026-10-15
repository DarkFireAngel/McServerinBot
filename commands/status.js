import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { checkAllHosts } from '../services/minecraft.js';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Mostra lo stato del server Cobblemon attualmente attivo.');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const allHosts = await checkAllHosts();
    const onlineHost = allHosts.find(h => h.online);

    if (!onlineHost) {
      const offlineEmbed = new EmbedBuilder()
        .setTitle('[○] Cobblemon - Stato Server')
        .setColor(0xe74c3c)
        .setDescription('Il server Cobblemon è attualmente **OFFLINE**.')
        .setTimestamp()
        .setFooter({ text: 'Cobblemon Server Monitor' });

      return await interaction.editReply({ embeds: [offlineEmbed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('[●] Cobblemon - Stato Server')
      .setColor(0x2ecc71)
      .addFields(
        {
          name: `[●] ${onlineHost.name} - ONLINE`,
          value: `• **IP**: \`${onlineHost.host}\`\n• **Giocatori**: ${onlineHost.playersOnline} / ${onlineHost.playersMax}`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Cobblemon Server Monitor' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[Command status] Errore:', error);
    await interaction.editReply({
      content: `[-] Si è verificato un errore durante il controllo dello stato: \`${error.message}\``
    });
  }
}
