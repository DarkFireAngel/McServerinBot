import util from 'minecraft-server-util';
import { HOSTS } from '../config.js';

/**
 * Esegue il ping di un server Minecraft.
 * @param {string} host 
 * @param {number} port 
 * @param {number} timeout 
 * @returns {Promise<object>}
 */
export async function pingServer(host, port = 25565, timeout = 4000) {
  try {
    const result = await util.status(host, port, {
      timeout,
      enableSRV: true
    });

    return {
      online: true,
      host,
      port,
      version: result.version?.name || 'Sconosciuta',
      protocol: result.version?.protocol || null,
      playersOnline: result.players?.online ?? 0,
      playersMax: result.players?.max ?? 0,
      playersSample: result.players?.sample ?? [],
      motd: result.motd?.clean || '',
      latency: result.roundTripLatency ?? null
    };
  } catch (error) {
    return {
      online: false,
      host,
      port,
      error: error.message || 'Offline o non raggiungibile'
    };
  }
}

/**
 * Controlla tutti gli host configurati (Angy e Rick).
 * @returns {Promise<Array<object>>}
 */
export async function checkAllHosts() {
  const checks = HOSTS.map(async (h) => {
    const status = await pingServer(h.host, h.port);
    return {
      ...h,
      ...status
    };
  });

  return Promise.all(checks);
}

/**
 * Trova il server attualmente attivo (se presente).
 * Se entrambi sono online, restituisce l'elenco di entrambi o il primo con player.
 * @returns {Promise<{ isAnyOnline: boolean, activeHosts: Array<object>, allHosts: Array<object> }>}
 */
export async function getMinecraftStatus() {
  const allHosts = await checkAllHosts();
  const activeHosts = allHosts.filter(h => h.online);

  return {
    isAnyOnline: activeHosts.length > 0,
    activeHosts,
    allHosts
  };
}
