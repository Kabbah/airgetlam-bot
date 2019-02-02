/* ========================================================================== */
/* CLASSE QUE GERENCIA OS COMANDOS E OS PLAYERS DE MÚSICA                     */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");

const MusicPlayer = require("./musicplayer.js");

/* ========================================================================== */

/**
 * Esta classe é um singleton que faz o controle de todos os players de músicas,
 * em diversos servidores.
 */
class MusicController {

    /**
     * Este é um construtor singleton: instancia um objeto em sua primeira
     * chamada, e nas chamadas subsequentes apenas retorna essa instância.
     */
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        /** Estrutura de dados que mantém os players de cada servidor.
         * @type {Discord.Collection<Discord.Snowflake, MusicPlayer>}
         */
        this.players = new Discord.Collection();

        this.constructor.instance = this;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Processa um comando de reprodução de música.
     * 
     * @param {Discord.Message} message mensagem em que o comando foi recebido
     * @param {string} songName nome da música
     */
    play(message, songName) {
        // Finaliza o comando prematuramente se o usuário não estiver em um
        // voice channel.
        if (!message.member.voiceChannel) {
            message.reply("you are not in a voice channel!");
            return;
        }

        const guildId = message.guild.id;

        let player = this.players.get(guildId);
        if (player && player.voiceConnection) {
            // O bot já está em um voice channel no server.

            if (player.isPlaying) {
                if (player.voiceConnection.channel.id === message.member.voiceChannel.id) {
                    player.enqueue(message.member, songName);
                }
                else {
                    message.reply("you must be in the same voice channel I'm playing at the moment!");
                }
            }
            else {
                player.startPlaying(message.member.voiceChannel, songName);
            }
        }
        else {
            // O bot não está em nenhum voice channel no server.
            // Cria um novo player.
            player = new MusicPlayer(guildId, this);
            this.players.set(guildId, player);

            player.startPlaying(message.member.voiceChannel, songName);
        }
    }

    /* ---------------------------------------------------------------------- */

    dropPlayer(player) {
        player.disconnect();

        this.players.delete(player.guildId);
    }

    /* ---------------------------------------------------------------------- */

    dropAllPlayers() {
        this.players.tap(player => {
            player.disconnect();
        });

        this.players.deleteAll();
    }

}

/* ========================================================================== */

module.exports = MusicController;

/* ========================================================================== */
