/* ========================================================================== */
/* CLASSE QUE IMPLEMENTA A REPRODUÇÃO DE MÚSICAS                              */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const ytdl = require("ytdl-core");

const MusicQueueItem = require("./music-queue-item.js");
const MusicSong = require("./music-song.js");

/* ========================================================================== */

// TODO: Verificar estas configs para melhorar a estabilidade da stream
const ytdlOptions = {
    quality: "highestaudio",
    filter: "audioonly",
    highWaterMark: 1 << 25,
};

/* ========================================================================== */

/**
 * Esta classe representa a instância de um player de músicas em um servidor.
 */
class MusicPlayer {

    /**
     * Construtor.
     * @param {Discord.Snowflake} guildId ID do servidor
     */
    constructor(guildId, musicController) {
        /** ID do servidor em que este player está sendo executado.
         * @type {Discord.Snowflake}
         */
        this.guildId = guildId;
        
        /** Referência ao controlador de musicas
         * @type {MusicController}
         */
        this.musicController = musicController;

        /** Canal de texto atual (no qual o bot enviará as mensagens a cada
         * troca de música, por exemplo)
         * @type {Discord.TextChannel}
         */
        this.textChannel = null;

        /** Voice connection, usada para reproduzir arquivos de áudio.
         * @type {Discord.VoiceConnection}
         */
        this.voiceConnection = null;

        /** Dispatcher, usado para transmitir uma stream de áudio.
         * @type {Discord.StreamDispatcher}
         */
        this.dispatcher = null;

        /** Volume, de 0.0 a 1.0.
         * @type {number}
         */
        this.volume = 1.0;

        /** Flag que mostra se o player está reproduzindo alguma música.
         * @type {boolean}
         */
        this.isPlaying = false;

        /** Música que está tocando no momento.
         * @type {MusicQueueItem}
         */
        this.currentSong = null;

        /** Referência a um timeout para sair do servidor, iniciado quando o
         * player fica ocioso.
         * @type {NodeJS.Timeout}
         */
        this.leaveTimeout = null;

        /** Fila de musicas.
         * @type {MusicQueueItem[]}
         */
        this.queue = [];
    }

    /* ---------------------------------------------------------------------- */

    /** Vincula o player de músicas a um canal de texto. Todas as mensagens
     * autônomas do bot (ex: troca de música) serão enviadas nesse canal.
     * @param {Discord.TextChannel} textChannel canal de texto
     */
    setTextChannel(textChannel) {
        this.textChannel = textChannel;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Começa a reproduzir uma música. Caso seja necessário, conecta-se a um
     * voice channel.
     * 
     * @param {Discord.GuildMember} voiceChannel membro que solicitou uma música
     * @param {MusicSong} song música a reproduzir
     */
    startPlaying(member, song) {
        const voiceChannel = member.voiceChannel;
        const player = this;

        this.currentSong = new MusicQueueItem(member, song);

        if (!player.voiceConnection || (player.voiceConnection.channel.id !== voiceChannel.id)) {
            voiceChannel.join().then(connection => {
                player.voiceConnection = connection;
                player.playYouTube(song);
            }).catch(console.log);
        }
        else {
            player.playYouTube(song);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Reproduz um arquivo de áudio no voice channel atual. Supõe que o bot está
     * em um voice channel.
     * Interrompe o timer de ociosidade.
     * 
     * @param {MusicSong} song música a reproduzir
     * @private
     */
    playYouTube(song) {
        const stream = ytdl(this.getYtUrl(song.id), ytdlOptions);

        console.log("Now playing: " + song.id);

        // const dispatcher = this.voiceConnection.playFile(filePath);
        this.dispatcher = this.voiceConnection.playStream(stream);
        this.dispatcher.setVolume(this.volume);

        if (this.leaveTimeout) {
            clearTimeout(this.leaveTimeout);
            this.leaveTimeout = null;
        }
        this.isPlaying = true;
        
        this.sendSongEmbed(song, ":arrow_forward: Now playing", this.currentSong.user.displayName);
        
        this.dispatcher.on("end", reason => {
            MusicPlayer.onSongEnd(this);
            if (reason) console.log(reason);
        });
        this.dispatcher.on("error", e => {
            console.error(e);
        });
    }

    /* ---------------------------------------------------------------------- */

    skipCurrentSong() {
        if (!this.dispatcher || !this.isPlaying) return;
        
        const embed = new Discord.RichEmbed()
            .setColor(0x286ee0)
            .setTitle(":track_next: Skipping...");
        this.textChannel.send(embed);

        this.dispatcher.end("Received a skip command");
        // Isso emite um evento "end", que chama onSongEnd.
    }

    /* ---------------------------------------------------------------------- */

    setVolume(newVolume) {
        this.volume = newVolume;
        if (this.dispatcher !== null) {
            this.dispatcher.setVolume(newVolume);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Função executada quando a execução de uma música termina.
     * Verifica se o bot está no modo auto-play ou se há mais itens na fila.
     * Se sim, inicia a reprodução do próximo item.
     * Senão, inicia o timer de ociosidade.
     * 
     * @param {MusicPlayer} player 
     */
    static onSongEnd(player) {
        // TODO: autoplay mode.
        if (player.queue.length > 0) {
            const queueItem = player.queue.shift();

            player.currentSong = queueItem;
            player.playYouTube(queueItem.song);
            return;
        }

        // If there is no song to play, start a timeout for the bot to leave the
        // voice channel.
        player.isPlaying = false;
        player.currentSong = null;
        player.leaveTimeout = setTimeout(() => {
            player.musicController.dropPlayer(player);
        }, 10000);
        // TODO: put timer miliseconds on config.json
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Inclui uma música na fila de reprodução.
     * @param {Discord.GuildMember} member usuário que solicitou a música
     * @param {MusicSong} song 
     */
    enqueue(member, song) {
        this.queue.push(new MusicQueueItem(member, song));

        console.log("Song \"" + song.title + "\" enqueued by " + member.displayName);

        this.sendSongEmbed(song, ":new: Song enqueued", member.displayName);
    }

    /* ---------------------------------------------------------------------- */
    
    getYtUrl(videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }
    
    /* ---------------------------------------------------------------------- */
    
    sendSongEmbed(song, embedTitle, memberName) {
        const embed = new Discord.RichEmbed()
            .setColor(0x286ee0)
            .setTitle(embedTitle)
            .setDescription("[" + song.title + "](" + this.getYtUrl(song.id) + ")\n" +
                "**Channel:** " + song.channelTitle + "\n" +
                "**Duration:** " + song.duration.asSeconds() + " s\n" +
                "**Enqueued by:** " + memberName)
            .setThumbnail(song.thumbnail);
        this.textChannel.send(embed);
    }
    
    /* ---------------------------------------------------------------------- */

    /**
     * Interrompe qualquer execução de áudio em andamento e desconecta o player
     * do canal de voz no qual está conectado.
     */
    disconnect() {
        if (this.voiceConnection) {
            this.voiceConnection.disconnect();
        }
        this.voiceConnection = null;
    }

}

/* ========================================================================== */

module.exports = MusicPlayer;

/* ========================================================================== */
