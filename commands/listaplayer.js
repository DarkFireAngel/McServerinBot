import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getMinecraftStatus } from '../services/minecraft.js';

export const data = new SlashCommandBuilder()
  .setName('listaplayer')
  .setDescription('Mostra il numero e la lista dei giocatori attualmente connessi al server Cobblemon.');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const status = await getMinecraftStatus();

    if (!status.isAnyOnline) {
      const offlineEmbed = new EmbedBuilder()
        .setTitle('[○] Server Chiuso')
        .setColor(0xe74c3c)
        .setDescription('Il server Cobblemon è attualmente **OFFLINE**.')
        .setTimestamp()
        .setFooter({ text: 'Cobblemon Server Monitor' });

      return await interaction.editReply({ embeds: [offlineEmbed] });
    }

    const activeServer = status.activeHosts[0];

    let playerListText = '';
    if (activeServer.playersOnline === 0) {
      playerListText = '*Nessun giocatore attualmente online.*';
    } else if (activeServer.playersSample && activeServer.playersSample.length > 0) {
      playerListText = activeServer.playersSample
        .map(p => `• **${p.name}**`)
        .join('\n');
      
      if (activeServer.playersOnline > activeServer.playersSample.length) {
        const extra = activeServer.playersOnline - activeServer.playersSample.length;
        playerListText += `\n*...e altri ${extra} player*`;
      }
    } else {
      playerListText = `*${activeServer.playersOnline} player connessi (il server non trasmette i singoli nickname).*`;
    }

    const embed = new EmbedBuilder()
      .setTitle('[●] Cobblemon - Lista Giocatori')
      .setColor(0x3498db)
      .addFields(
        { name: 'Host Attivo', value: `**${activeServer.name}** (\`${activeServer.host}\`)`, inline: false },
        { name: `Giocatori Online (${activeServer.playersOnline} / ${activeServer.playersMax})`, value: playerListText, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Cobblemon Server Monitor' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[Command listaplayer] Errore:', error);
    await interaction.editReply({
      content: `[-] Si è verificato un errore durante il recupero dei giocatori: \`${error.message}\``
    });
  }
}
