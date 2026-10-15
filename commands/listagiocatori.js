import { SlashCommandBuilder } from 'discord.js';
import { execute as executeListaPlayer } from './listaplayer.js';

export const data = new SlashCommandBuilder()
  .setName('listagiocatori')
  .setDescription('Mostra il numero e la lista dei giocatori attualmente connessi al server Cobblemon.');

export async function execute(interaction) {
  return executeListaPlayer(interaction);
}
