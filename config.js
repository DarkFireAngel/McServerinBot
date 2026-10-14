import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  channelId: process.env.CHANNEL_ID || '',
  guildId: process.env.GUILD_ID || '', // Opzionale: se specificato registra i comandi istantaneamente su questo server
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL || '30', 10),
  port: process.env.PORT || 3000, // Per healthcheck su Railway
};

export const HOSTS = [
  {
    name: 'Angy',
    host: process.env.ANGY_HOST || 'cobblemunzs.duckdns.org',
    port: parseInt(process.env.ANGY_PORT || '25565', 10)
  },
  {
    name: 'Rick',
    host: process.env.RICK_HOST || 'cobbleverse-pazza.duckdns.org',
    port: parseInt(process.env.RICK_PORT || '25565', 10)
  }
];
