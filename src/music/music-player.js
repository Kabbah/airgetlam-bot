/* ========================================================================== */
/* CLASSE QUE IMPLEMENTA A REPRODUÇÃO DE MÚSICAS                              */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const ytdl = require("ytdl-core");

const MusicQueueItem = require("./music-queue-item.js");

/* ========================================================================== */

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

        /** Voice connection, usada para reproduzir arquivos de áudio.
         * @type {Discord.VoiceConnection}
         */
        this.voiceConnection = null;

        /** Volume, de 0.0 a 1.0.
         * @type {number}
         */
        this.volume = 1.0;

        /** Flag que mostra se o player está reproduzindo alguma música.
         * @type {boolean}
         */
        this.isPlaying = false;

        /** Referência a um timeout para sair do servidor, iniciado quando o
         * player fica ocioso.
         * @type {NodeJS.Timeout}
         */
        this.leaveTimeout = null;

        /** Fila de musicas.
         * @type {string[]}
         */
        this.queue = [];
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Começa a reproduzir uma música. Caso seja necessário, conecta-se a um
     * voice channel.
     * 
     * *Atenção:* caso o bot já esteja executando alguma música, este método
     * apenas retorna sem fazer nada. Nesse caso, deve ser executado o método
     * `enqueue`.
     * 
     * @param {Discord.VoiceChannel} voiceChannel canal para reproduzir música
     * @param {string} songName nome da música
     */
    startPlaying(voiceChannel, songName) {
        if (this.isPlaying) return;

        const player = this;
        if (!player.voiceConnection || (player.voiceConnection.channel.id !== voiceChannel.id)) {
            voiceChannel.join().then(connection => {
                player.voiceConnection = connection;
                player.playMusic(songName);
            }).catch(console.log);
        }
        else {    
            player.playMusic(songName);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Reproduz um arquivo de áudio no voice channel atual. Supõe que o bot está
     * em um voice channel.
     * Interrompe o timer de ociosidade.
     * 
     * @param {string} songName nome da música
     * @private
     */
    playMusic(songName) {
        const stream = ytdl("https://www.youtube.com/watch?v=" + songName, ytdlOptions);

        console.log("Now playing: " + songName);

        // const dispatcher = this.voiceConnection.playFile(filePath);
        const dispatcher = this.voiceConnection.playStream(stream);

        if (this.leaveTimeout) {
            clearTimeout(this.leaveTimeout);
            this.leaveTimeout = null;
        }
        this.isPlaying = true;

        dispatcher.setVolume(this.volume);
        
        dispatcher.on("end", reason => {
            MusicPlayer.onSongEnd(this);
            if (reason) console.log(reason);
        });
        dispatcher.on("error", e => {
            console.error(e);
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Função executada quando a execução de uma música termina.
     * Verifica se o bot está no mdoo auto-play ou se há mais itens na fila.
     * Se sim, inicia a reprodução do próximo item.
     * Senão, inicia o timer de ociosidade.
     * 
     * @param {MusicPlayer} player 
     */
    static onSongEnd(player) {
        // TODO: Check queue for next song or autoplay mode.
        if (player.queue.length > 0) {
            const queueItem = player.queue.shift();

            player.playMusic(queueItem.song);
            return;
        }

        // If there is no song to play, start a timeout for the bot to leave the
        // voice channel.
        player.isPlaying = false;
        player.leaveTimeout = setTimeout(() => {
            player.musicController.dropPlayer(player);
        }, 10000);
        // TODO: put timer miliseconds on config.json
        
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Inclui uma música na fila de reprodução.
     * @param {Discord.GuildMember} member usuário que solicitou a música
     * @param {string} song 
     */
    enqueue(member, song) {
        this.queue.push(new MusicQueueItem(member, song));

        console.log("Song \"" + song + "\" enqueued by " + member.displayName);
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
