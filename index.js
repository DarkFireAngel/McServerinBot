import http from 'http';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection
} from 'discord.js';
import { config } from './config.js';
import { startMonitoring } from './services/monitor.js';

import * as cmdListaPlayer from './commands/listaplayer.js';
import * as cmdListaGiocatori from './commands/listagiocatori.js';
import * as cmdStatus from './commands/status.js';
import * as cmdImpostaCanale from './commands/impostacanale.js';

// Creazione del client Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Registrazione locale dei comandi
client.commands = new Collection();
client.commands.set(cmdListaPlayer.data.name, cmdListaPlayer);
client.commands.set(cmdListaGiocatori.data.name, cmdListaGiocatori);
client.commands.set(cmdStatus.data.name, cmdStatus);
client.commands.set(cmdImpostaCanale.data.name, cmdImpostaCanale);

/**
 * Registra gli Slash Commands sulle API di Discord.
 */
async function registerSlashCommands() {
  if (!config.discordToken || !config.clientId) {
    console.warn('[Slash Commands] DISCORD_TOKEN o CLIENT_ID mancanti nel file .env. I comandi non possono essere registrati.');
    return;
  }

  const commands = [
    cmdListaPlayer.data.toJSON(),
    cmdListaGiocatori.data.toJSON(),
    cmdStatus.data.toJSON(),
    cmdImpostaCanale.data.toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    console.log(`[Slash Commands] Inizio registrazione di ${commands.length} comandi...`);

    // 1. Registra su ogni server in cui il bot si trova per renderli utilizzabili istantaneamente
    for (const [guildId, guild] of client.guilds.cache) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commands }
      ).catch(e => console.warn(`[Slash Commands] Impossibile registrare sul server ${guild.name}:`, e.message));
      console.log(`[Slash Commands] Comandi registrati istantaneamente per il server: ${guild.name} (${guildId})`);
    }

    // 2. Se è specificato un GUILD_ID esplicito, registralo anche lì
    if (config.guildId && !client.guilds.cache.has(config.guildId)) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      ).catch(() => {});
    }

    // 3. Registrazione globale
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );
    console.log('[Slash Commands] Comandi registrati globalmente con successo!');
  } catch (error) {
    console.error('[Slash Commands] Errore durante la registrazione dei comandi:', error);
  }
}

// Quando il bot viene aggiunto a un nuovo server
client.on('guildCreate', async (guild) => {
  console.log(`[Bot] Aggiunto al nuovo server: ${guild.name} (${guild.id})`);
  await registerSlashCommands();
});

// Gestione interazioni (Slash Commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Command Error] Errore eseguendo /${interaction.commandName}:`, error);
    const reply = {
      content: '[-] Si è verificato un errore durante l\'esecuzione di questo comando!',
      ephemeral: true
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// Evento quando il bot è pronto
client.once('ready', async () => {
  console.log(`\n========================================`);
  console.log(`[*] Bot Discord online come: ${client.user.tag}`);
  console.log(`[*] Canale notifiche configurato: ${config.channelId || '(Nessun canale configurato)'}`);
  console.log(`[*] Intervallo controllo: ${config.checkIntervalSeconds}s`);
  console.log(`========================================\n`);

  // Registra o aggiorna gli Slash Commands
  await registerSlashCommands();

  // Avvia il loop di monitoraggio
  startMonitoring(client);
});

// Mini server HTTP per il deployment su Railway (soddisfa l'healthcheck di porta di Railway)
function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        bot: client.user ? client.user.tag : 'starting',
        uptime: process.uptime()
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(config.port, () => {
    console.log(`[Health Server] Server HTTP attivo sulla porta ${config.port} (per Railway healthcheck)`);
  });
}

// Avvio
startHealthServer();

if (!config.discordToken) {
  console.error('\n[-] ERRORE: DISCORD_TOKEN non trovato nel file .env!');
  console.error('Copia il file .env.example in .env e inserisci il token del tuo bot Discord.\n');
} else {
  client.login(config.discordToken).catch((err) => {
    console.error('[-] Errore durante il login su Discord:', err.message);
  });
}
