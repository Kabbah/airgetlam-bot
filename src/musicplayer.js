/* ========================================================================== */
/* CLASSE QUE GERENCIA A REPRODUÇÃO DE MÚSICAS                                */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const ytdl = require("ytdl-core");

/* ========================================================================== */

/**
 * Esta classe representa a instância de um player de músicas em um servidor.
 */
class MusicPlayer {

    /**
     * Construtor.
     * @param {Discord.Snowflake} guildId ID do servidor
     */
    constructor(guildId) {
        /** ID do servidor em que este player está sendo executado.
         * @type {Discord.Snowflake}
         */
        this.guildId = guildId;

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
        const stream = ytdl("https://www.youtube.com/watch?v=" + songName);
        const streamOptions = { seek: 0, volume: 1, bitrate: 48000, passes: 2 };

        console.log(songName);

        // const dispatcher = this.voiceConnection.playFile(filePath);
        const dispatcher = this.voiceConnection.playStream(stream, streamOptions);

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

        // If there is no song to play, start a timeout for the bot to leave the
        // voice channel.
        player.isPlaying = false;
        player.leaveTimeout = setTimeout(() => {
            (new MusicPlayerController()).dropPlayer(player);
        }, 10000);
        // TODO: put timer miliseconds on config.json
        
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Inclui uma música na fila de reprodução.
     * @param {string} song 
     */
    enqueue(song) {
        // TODO
        console.log("Not implemented: enqueue " + song);
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

/**
 * Esta classe é um singleton que faz o controle de todos os players de músicas,
 * em diversos servidores.
 */
class MusicPlayerController {

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
                    player.enqueue(songName);
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
            player = new MusicPlayer(guildId);
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

module.exports = MusicPlayerController;

/* ========================================================================== */
