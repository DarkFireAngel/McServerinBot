import { EmbedBuilder, ActivityType } from 'discord.js';
import { config } from '../config.js';
import { getMinecraftStatus } from './minecraft.js';

let lastState = {
  isOnline: null,
  activeHostNames: []
};

/**
 * Crea l'embed per il server aperto.
 * @param {object} serverInfo 
 * @returns {EmbedBuilder}
 */
export function createServerOpenEmbed(serverInfo) {
  return new EmbedBuilder()
    .setTitle('[●] SERVER APERTO')
    .setColor(0x2ecc71)
    .setDescription(`Il server **Cobblemon** è ora **ONLINE**.`)
    .addFields(
      { name: 'Host Attivo', value: `**${serverInfo.name}**`, inline: true },
      { name: 'IP', value: `\`${serverInfo.host}\``, inline: true },
      { name: 'Giocatori', value: `${serverInfo.playersOnline} / ${serverInfo.playersMax}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Cobblemon Server Monitor' });
}

/**
 * Crea l'embed quando l'host cambia (es. da Angy a Rick o viceversa).
 * @param {object} serverInfo 
 * @returns {EmbedBuilder}
 */
export function createHostChangedEmbed(serverInfo) {
  return new EmbedBuilder()
    .setTitle('[►] HOST CAMBIATO')
    .setColor(0xf39c12)
    .setDescription(`L'host del server Cobblemon è cambiato in **${serverInfo.name}**.`)
    .addFields(
      { name: 'Nuovo Host', value: `**${serverInfo.name}**`, inline: true },
      { name: 'IP', value: `\`${serverInfo.host}\``, inline: true },
      { name: 'Giocatori', value: `${serverInfo.playersOnline} / ${serverInfo.playersMax}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Cobblemon Server Monitor' });
}

/**
 * Crea l'embed per il server chiuso.
 * @param {string} lastHostName 
 * @returns {EmbedBuilder}
 */
export function createServerClosedEmbed(lastHostName = null) {
  const embed = new EmbedBuilder()
    .setTitle('[○] SERVER CHIUSO')
    .setColor(0xe74c3c)
    .setDescription('Il server Cobblemon è attualmente **OFFLINE**.')
    .setTimestamp()
    .setFooter({ text: 'Cobblemon Server Monitor' });

  if (lastHostName) {
    embed.addFields({ name: 'Ultimo Host Attivo', value: lastHostName, inline: true });
  }

  return embed;
}

/**
 * Aggiorna lo stato (Presence) del bot su Discord.
 * @param {import('discord.js').Client} client 
 * @param {boolean} isOnline 
 * @param {object|null} activeServer 
 */
export function updateBotPresence(client, isOnline, activeServer = null) {
  if (!client.user) return;

  if (isOnline && activeServer) {
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: `${activeServer.name} (${activeServer.playersOnline}/${activeServer.playersMax})`,
          type: ActivityType.Playing
        }
      ]
    });
  } else {
    client.user.setPresence({
      status: 'idle',
      activities: [
        {
          name: 'Server Offline',
          type: ActivityType.Custom
        }
      ]
    });
  }
}

export let currentChannelId = config.channelId || '';

/**
 * Imposta manualmente il canale per le notifiche (es. via /impostacanale).
 * @param {string} channelId 
 */
export function setTargetChannel(channelId) {
  currentChannelId = channelId;
  console.log(`[Monitor] Canale notifiche impostato su: ${channelId}`);
}

/**
 * Recupera o rileva automaticamente il canale in cui inviare le notifiche.
 * @param {import('discord.js').Client} client 
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
export async function getNotificationChannel(client) {
  // 1. Se è configurato esplicitamente un canale, usalo
  if (currentChannelId) {
    const channel = client.channels.cache.get(currentChannelId) || await client.channels.fetch(currentChannelId).catch(() => null);
    if (channel && channel.isTextBased()) return channel;
  }

  // 2. Altrimenti, prova ad auto-rilevare il canale più adatto nei server in cui è presente il bot
  for (const [, guild] of client.guilds.cache) {
    try {
      const channels = await guild.channels.fetch();
      
      // Cerca per parole chiave (cobblemon, minecraft, server, notifiche, generale)
      const keywords = ['cobblemon', 'minecraft', 'mc', 'server', 'notifiche', 'generale', 'general'];
      let candidate = null;

      for (const [, ch] of channels) {
        if (!ch || !ch.isTextBased()) continue;
        const perms = ch.permissionsFor(client.user);
        if (!perms || !perms.has('SendMessages')) continue;

        const name = ch.name.toLowerCase();
        for (const kw of keywords) {
          if (name.includes(kw)) {
            candidate = ch;
            break;
          }
        }
        if (candidate) break;
      }

      // Se non trova corrispondenze nei nomi, usa il systemChannel del server o il primo canale testuale
      if (!candidate && guild.systemChannel && guild.systemChannel.permissionsFor(client.user)?.has('SendMessages')) {
        candidate = guild.systemChannel;
      }

      if (!candidate) {
        for (const [, ch] of channels) {
          if (ch && ch.isTextBased() && ch.permissionsFor(client.user)?.has('SendMessages')) {
            candidate = ch;
            break;
          }
        }
      }

      if (candidate) {
        currentChannelId = candidate.id;
        console.log(`[Monitor] Canale rilevato automaticamente: #${candidate.name} (ID: ${candidate.id}) nel server ${guild.name}`);
        return candidate;
      }
    } catch (e) {
      console.warn(`[Monitor] Impossibile rilevare canale nel server ${guild.name}:`, e.message);
    }
  }

  return null;
}

/**
 * Esegue il controllo dello stato e invia messaggi nel canale se lo stato è cambiato.
 * @param {import('discord.js').Client} client 
 */
export async function checkServerStatus(client) {
  try {
    const status = await getMinecraftStatus();
    const isOnline = status.isAnyOnline;
    const activeHostNames = status.activeHosts.map(h => h.name);
    const activeServer = status.activeHosts[0] || null;

    // Aggiorna sempre la presenza del bot su Discord
    updateBotPresence(client, isOnline, activeServer);

    // Se è la prima esecuzione, inizializziamo lo stato senza spammare in chat
    if (lastState.isOnline === null) {
      lastState = {
        isOnline,
        activeHostNames
      };
      console.log(`[Monitor] Inizializzato stato: ${isOnline ? `ONLINE su ${activeHostNames.join(', ')}` : 'OFFLINE'}`);
      return;
    }

    const channel = await getNotificationChannel(client);
    if (!channel) {
      return;
    }

    // Caso 1: Il server era OFFLINE ed è diventato ONLINE
    if (!lastState.isOnline && isOnline && activeServer) {
      console.log(`[Monitor] Transizione -> SERVER APERTO su ${activeServer.name}`);
      const embed = createServerOpenEmbed(activeServer);
      await channel.send({ embeds: [embed] });
    }
    // Caso 2: Il server era ONLINE ed è diventato OFFLINE
    else if (lastState.isOnline && !isOnline) {
      console.log('[Monitor] Transizione -> SERVER CHIUSO');
      const lastHostName = lastState.activeHostNames.join(', ');
      const embed = createServerClosedEmbed(lastHostName);
      await channel.send({ embeds: [embed] });
    }
    // Caso 3: Era ONLINE ed è ancora ONLINE, ma l'host attivo è cambiato (es. Angy -> Rick)
    else if (lastState.isOnline && isOnline && activeServer) {
      const hostsChanged = activeHostNames.sort().join(',') !== lastState.activeHostNames.sort().join(',');
      if (hostsChanged) {
        console.log(`[Monitor] Transizione -> HOST CAMBIATO a ${activeServer.name}`);
        const embed = createHostChangedEmbed(activeServer);
        await channel.send({ embeds: [embed] });
      }
    }

    // Aggiorna lo stato salvato
    lastState = {
      isOnline,
      activeHostNames
    };
  } catch (error) {
    console.error('[Monitor] Errore durante il controllo del server:', error);
  }
}

/**
 * Avvia il timer di monitoraggio continuo.
 * @param {import('discord.js').Client} client 
 */
export function startMonitoring(client) {
  const intervalMs = Math.max(10, config.checkIntervalSeconds) * 1000;
  console.log(`[Monitor] Monitoraggio avviato ogni ${intervalMs / 1000} secondi.`);

  // Controllo immediato all'avvio
  checkServerStatus(client);

  // Controllo periodico
  return setInterval(() => {
    checkServerStatus(client);
  }, intervalMs);
}
