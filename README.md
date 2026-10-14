# 🎮 McServerinBot - Discord Monitor per Cobblemon

Bot Discord in Node.js per monitorare in tempo reale lo stato del server Minecraft Cobblemon hostato alternativamente da **Angy** (`cobblemunzs.duckdns.org`) e **Rick** (`cobbleverse-pazza.duckdns.org`).

---

## ✨ Funzionalità

- 🟢 **Notifica Automatica "Server Aperto"**: Quando uno dei due host avvia il server, il bot invia un messaggio con embed dettagliato (chi sta hostando, IP, versione, giocatori e ping).
- 🔴 **Notifica Automatica "Server Chiuso"**: Quando il server viene spento (entrambi gli host offline), invia un avviso in chat.
- 🔄 **Notifica "Host Cambiato"**: Se il server passa da un host all'altro (es. da Angy a Rick).
- 👥 **Comando Slash `/listaplayer`**: Mostra il numero dei giocatori online e la lista dei nickname attualmente connessi.
- 📊 **Comando Slash `/status`**: Mostra una panoramica dello stato di entrambi gli host.
- 🎮 **Presenza Discord Dinamica**: Lo stato del bot su Discord mostra sempre se il server è aperto e quanti player ci sono (es. `Angy (1/20)`).
- 🚀 **Pronto per Railway**: Include un mini server HTTP per superare i controlli di integrità di Railway ed essere attivo 24/7.

---

## 🛠️ Requisiti

- **Node.js** v18 o superiore
- Un'applicazione bot creata sul [Discord Developer Portal](https://discord.com/developers/applications)

---

## ⚙️ 1. Configurazione del Bot su Discord

1. Vai su [Discord Developer Portal](https://discord.com/developers/applications) e clicca su **New Application**.
2. Dagli un nome (es. `McServerinBot`).
3. Nella sezione **General Information**, copia l'**Application ID** (sarà il tuo `CLIENT_ID`).
4. Vai nella sezione **Bot**:
   - Clicca su **Reset Token** per generare e copiare il tuo **Token** (sarà il tuo `DISCORD_TOKEN`).
5. Vai nella sezione **OAuth2** -> **URL Generator**:
   - Seleziona gli **Scopes**: `bot`, `applications.commands`
   - Seleziona i **Bot Permissions**:
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Read Message History`
     - `View Channels`
   - Copia il link generato in basso e aprilo nel browser per invitare il bot nel tuo server Discord.
6. Copia l'ID del canale testuale di Discord in cui vuoi ricevere le notifiche:
   - Su Discord: Impostazioni Utente -> Avanzate -> Attiva la **Modalità sviluppatore**.
   - Fai clic destro sul canale desiderato -> **Copia ID canale** (sarà il tuo `CHANNEL_ID`).
   - (Opzionale) Fai clic destro sull'icona del server -> **Copia ID server** (sarà il tuo `GUILD_ID`, utile per registrare i comandi slash all'istante senza attendere la propagazione globale di Discord).

---

## 💻 2. Test in Locale

1. Apri il file `.env` presente nella cartella del progetto e compila i campi:
   ```env
   DISCORD_TOKEN=incolla_qui_il_tuo_token
   CLIENT_ID=incolla_qui_il_tuo_client_id
   CHANNEL_ID=incolla_qui_l_id_del_canale
   GUILD_ID=incolla_qui_l_id_del_server_per_comandi_istantanei
   ```

2. Avvia il bot:
   ```bash
   npm start
   ```

3. Nel terminale vedrai la conferma di connessione e il bot sarà online su Discord!

---

## 🚂 3. Deploy su Railway (Sempre Online 24/7)

Per tenere il bot attivo senza dover lasciare il computer acceso:

### Metodo A: Connessione GitHub (Consigliato)
1. Carica questa cartella su un tuo repository GitHub (es. privato o pubblico).
2. Vai su [Railway.app](https://railway.app/) e crea un account o accedi.
3. Clicca su **New Project** -> **Deploy from GitHub repo** e seleziona il tuo repository `McServerinBot`.
4. Vai nelle **Variables** del progetto su Railway e aggiungi le variabili d'ambiente:
   - `DISCORD_TOKEN` = il tuo token
   - `CLIENT_ID` = il tuo client ID
   - `CHANNEL_ID` = l'ID del canale
   - `GUILD_ID` = (opzionale) l'ID del server
   - `CHECK_INTERVAL` = 30
5. Railway rileverà automaticamente `package.json`, installerà i pacchetti e avvierà il bot!

### Metodo B: Tramite Railway CLI
Se preferisci usare il terminale:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
Poi aggiungi le variabili dalla dashboard web di Railway o con `railway variables set DISCORD_TOKEN=...`.

---

## 📁 Struttura del Progetto

```
McServerinBot/
├── commands/
│   ├── listaplayer.js   # Comando Slash /listaplayer
│   └── status.js        # Comando Slash /status
├── services/
│   ├── minecraft.js     # Query e ping ai server Cobblemon
│   └── monitor.js       # Monitoraggio periodico e invio notifiche Discord
├── config.js            # Caricamento variabili e host (Angy & Rick)
├── index.js             # Entry point del bot Discord e server healthcheck
├── package.json         # Dipendenze (discord.js, minecraft-server-util, dotenv)
├── railway.json         # Configurazione di deploy per Railway
├── Procfile             # Configurazione processo Railway
├── .env.example         # Esempio configurazione
└── .env                 # File variabili d'ambiente locali (ignorato da git)
```
