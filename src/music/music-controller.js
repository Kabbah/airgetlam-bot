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
            searchYouTube(songName)
                .then(musicSong => {
                    if (musicSong === null) return;
                    player.isPlaying = true;
                    player.setTextChannel(message.channel);
                    player.startPlaying(message.member, musicSong);
                })
                .catch(console.error);
            return;
        }
        
        // ENQUEUE
        // Caso em que o bot está reproduzindo algo, e está no mesmo voice
        // channel que o membro que solicitou uma música.
        if (player.voiceConnection.channel.id === message.member.voiceChannel.id) {
            searchYouTube(songName)
                .then(musicSong => {
                    if (musicSong === null) return;
                    player.setTextChannel(message.channel);
                    player.enqueue(message.member, musicSong);
                })
                .catch(console.error);
            return;
        }
        
        // FAIL
        // Caso em que o bot está reproduzindo algo, e não está no mesmo voice
        // channel que o membro que solicitou uma música.
        message.reply("you must be in the same voice channel I'm playing at the moment!");
    }
    
    /* ---------------------------------------------------------------------- */

    skip(message) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player || !player.voiceConnection || !player.isPlaying) {
            message.reply("I'm not playing anything in this server at the moment!");
            return;
        }

        if (player.voiceConnection.channel.id === message.member.voiceChannel.id) {
            player.skipCurrentSong();
            return;
        }

        message.reply("you can only skip the current song if you are in my voice channel!");
    }

    /* ---------------------------------------------------------------------- */

    tellVolume(message) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player) {
            message.reply("I'm not playing anything in this server at the moment!");
            return;
        }

        message.reply("the current volume is: " + player.volume * 50);
    }

    /* ---------------------------------------------------------------------- */

    setVolume(message, newVolume) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player || !player.voiceConnection) {
            message.reply("you can only set the volume when I'm connected to a voice channel!");
            return;
        }

        if (isNaN(newVolume)) {
            message.reply("this is not a valid volume value!");
            return;
        }

        // TODO: Configurar esse range, o (/50) abaixo e o (*50) acima
        if (newVolume < 0 || newVolume > 100) {
            message.reply("please specify a volume value between 0 and 100.");
            return;
        }

        player.setVolume(newVolume / 50);
    }

    /* ---------------------------------------------------------------------- */

    showCurrentSong(message) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player || !player.voiceConnection || !player.isPlaying) {
            message.reply("I'm not playing anything in this server at the moment!");
            return;
        }

        player.sendCurrentSongEmbed();
    }

    /* ---------------------------------------------------------------------- */

    showQueue(message, page) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player || !player.voiceConnection || !player.isPlaying) {
            message.reply("I'm not playing anything in this server at the moment!");
            return;
        }

        player.sendQueueEmbed(page);
    }

    /* ---------------------------------------------------------------------- */

    toggleAutoplay(message) {
        const guildId = message.guild.id;
        const player = this.players.get(guildId);

        if (!player || !player.voiceConnection) {
            message.reply("I'm not playing anything in this server at the moment!");
            return;
        }

        player.toggleAutoplay();
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

    /* ---------------------------------------------------------------------- */

    async searchRelatedVideo(videoId, videoHistory) {
        return await searchYouTubeRelatedVideo(videoId, videoHistory);
    }

}

/* ========================================================================== */

/**
 * Aplica uma expressão regular no parâmetro str e tenta obter o valor do ID
 * do vídeo.
 * 
 * @param {string} str string de parâmetro do comando play
 */
function getYouTubeVideoIdFromUrl(str) {
    const regex = /^(?:http(?:s)?:\/\/)?(?:(?:(?:www\.)?youtube\.com\/watch\?(?:\w*=\w*&)*v=)|(?:youtu\.be\/))([0-9A-Za-z_-]{10}[048AEIMQUYcgkosw])/g;

    const match = regex.exec(str);
    if (match) {
        return match[1];
    }
    return null;
}

/* -------------------------------------------------------------------------- */

async function searchYouTube(query) {
    const videoId = getYouTubeVideoIdFromUrl(query);
    if (videoId) {
        console.log("User provided direct YouTube URL. Video ID is " + videoId + ". Skipping youtube.search.list.");
        return await searchYouTubeByVideoId(videoId);
    }

    return await searchYouTubeByQuery(query);
}

/* -------------------------------------------------------------------------- */

async function searchYouTubeByQuery(query) {
    const searchResponse = await doYouTubeSearchList({ q: query });
    if (searchResponse.data.items.length === 0) {
        return null;
    }

    const videoInfo = searchResponse.data.items[0];

    const videoDetails = await youtube.videos.list({
        part: "contentDetails",
        id: videoInfo.id.videoId,
    });
    if (videoDetails.data.items.length === 0) {
        return null;
    }

    const musicSong = new MusicSong(videoInfo);
    musicSong.setDuration(videoDetails.data.items[0].contentDetails.duration);

    return musicSong;
}

/* -------------------------------------------------------------------------- */

async function searchYouTubeByVideoId(videoId) {
    const videoDetails = await youtube.videos.list({
        part: "snippet,contentDetails",
        id: videoId,
    });
    if (videoDetails.data.items.length === 0) {
        return null;
    }

    const videoInfo = videoDetails.data.items[0];

    const musicSong = new MusicSong(videoInfo);
    musicSong.id = videoId;
    musicSong.setDuration(videoInfo.contentDetails.duration);

    return musicSong;
}

/* -------------------------------------------------------------------------- */

async function searchYouTubeRelatedVideo(videoId, videoHistory) {
    const searchResponse = await doYouTubeSearchList({ relatedToVideoId: videoId });
    const videos = searchResponse.data.items;
    
    if (videos.length === 0) {
        return null;
    }
    
    let videoInfo = null;
    for (const video of videos) {
        if (!videoHistory.includes(video.id.videoId)) {
            videoInfo = video;
            break;
        }
        console.log("Video " + video.id.videoId + " already in history.");
    }
    if (!videoInfo) {
        // Every video found was in the cache already. Choose the last result.
        videoInfo = videos[videos.length - 1];
    }
    
    const videoDetails = await youtube.videos.list({
        part: "contentDetails",
        id: videoInfo.id.videoId,
    });
    if (videoDetails.data.items.length === 0) {
        return null;
    }

    const musicSong = new MusicSong(videoInfo);
    musicSong.setDuration(videoDetails.data.items[0].contentDetails.duration);

    return musicSong;
}

/* -------------------------------------------------------------------------- */

async function doYouTubeSearchList(extraSearchOptions) {
    const searchOptions = {
        part: "snippet",
        type: "video",
        maxResults: config.youtube.maxResults,
        regionCode: config.youtube.regionCode,
    };

    for (const key in extraSearchOptions) {
        searchOptions[key] = extraSearchOptions[key];
    }

    return await youtube.search.list(searchOptions);
}

/* ========================================================================== */

module.exports = MusicController;

/* ========================================================================== */
