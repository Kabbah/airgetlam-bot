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

const MusicPlayer = require("./music-player.js");
const MusicSong = require("./music-song.js");

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
        
        // Instancia um novo player se necessário.
        if (!player) {
            player = new MusicPlayer(guildId, this);
            this.players.set(guildId, player);
        }
        
        // START PLAYING
        // Caso em que:
        //  * ou o bot não está em nenhum voice channel no server,
        //  * ou o bot está em um voice channel, mas não está reproduzindo nada.
        if (!player.voiceConnection || !player.isPlaying) {
            player.isPlaying = true;
            searchYouTube(songName).then(musicSong => {
                if (musicSong === null) return;
                player.setTextChannel(message.channel);
                player.startPlaying(message.member.voiceChannel, musicSong);
            });
            return;
        }
        
        // ENQUEUE
        // Caso em que o bot está reproduzindo algo, e está no mesmo voice
        // channel que o membro que solicitou uma música.
        if (player.voiceConnection.channel.id === message.member.voiceChannel.id) {
            searchYouTube(songName).then(musicSong => {
                if (musicSong === null) return;
                player.setTextChannel(message.channel);
                player.enqueue(message.member, musicSong);
            }).catch(console.error);
            return;
        }
        
        // FAIL
        // Caso em que o bot está reproduzindo algo, e não está no mesmo voice
        // channel que o membro que solicitou uma música.
        message.reply("you must be in the same voice channel I'm playing at the moment!");
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
    const musicSong = new MusicSong(videoInfo);
    
    const videoDetails = await youtube.videos.list({
        part: "contentDetails",
        id: videoInfo.id.videoId,
    });

    if (videoDetails.data.items.length !== 0) {
        musicSong.setDuration(videoDetails.data.items[0].contentDetails.duration);
    }

    return musicSong;
}

/* ========================================================================== */

module.exports = MusicController;

/* ========================================================================== */
