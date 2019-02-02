/* ========================================================================== */
/* CLASSE QUE GERENCIA OS COMANDOS E OS PLAYERS DE MÚSICA                     */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const { google } = require("googleapis");

const config = require("../config.json");
const youtube = google.youtube({
    version: "v3",
    auth: config.youtube.key,
});

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
                    searchYouTube(songName).then(videoData => {
                        if (videoData === null) return;
                        player.enqueue(message.member, videoData.id);
                    }).catch(console.error);
                }
                else {
                    message.reply("you must be in the same voice channel I'm playing at the moment!");
                }
            }
            else {
                searchYouTube(songName).then(videoData => {
                    if (videoData === null) return;
                    player.startPlaying(message.member.voiceChannel, videoData.id);
                });
            }
        }
        else {
            // O bot não está em nenhum voice channel no server.
            // Cria um novo player.
            player = new MusicPlayer(guildId, this);
            this.players.set(guildId, player);

            searchYouTube(songName).then(videoData => {
                if (videoData === null) return;
                player.startPlaying(message.member.voiceChannel, videoData.id);
            });
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

async function searchYouTube(query) {
    const searchResponse = await youtube.search.list({
        part: "snippet",
        type: "video",
        q: query,
        maxResults: 1,
        regionCode: config.youtube.regionCode,
    });

    if (searchResponse.data.items.length === 0) {
        return null;
    }

    const videoInfo = searchResponse.data.items[0];

    // TODO: Alterar isso por uma classe decente
    let videoData = {
        id: videoInfo.id.videoId,
        title: videoInfo.snippet.title,
        channelTitle: videoInfo.snippet.channelTitle,
        thumbnails: videoInfo.snippet.thumbnails.default,
        duration: null,
    }
    
    const videoDetails = await youtube.videos.list({
        part: "contentDetails",
        id: videoInfo.id.videoId,
    });

    if (videoDetails.data.items.length !== 0) {
        videoData.duration = videoDetails.data.items[0].contentDetails.duration;
    }

    return videoData;
}

/* ========================================================================== */

module.exports = MusicController;

/* ========================================================================== */
