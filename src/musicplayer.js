/* ========================================================================== */
/* CLASSE QUE GERENCIA A REPRODUÇÃO DE MÚSICAS                                */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const fs = require("fs");

/* ========================================================================== */

class MusicPlayer {

    constructor(guildId) {
        /** ID of the server this player is running on */
        this.guildId = guildId;

        /** Voice connection, used to play sound files */
        this.voiceConnection = null;

        /** Volume, from 0.0 to 1.0 */
        this.volume = 1.0;

        /** Flag that shows if the player is currently playing a song */
        this.isPlaying = false;

        /** Reference to a leave timeout, started when no song is playing */
        this.leaveTimeout = null;
    }

    /* ---------------------------------------------------------------------- */

    play(voiceChannel, filePath) {
        const player = this;

        // If the player is not connected to a voice channel, join it and create
        // a new voice connection.
        if (!player.voiceConnection) {
            voiceChannel.join().then(connection => {
                player.voiceConnection = connection;
                player.playMusic(filePath);
            }).catch(console.log);
        }
        else {    
            player.playMusic(filePath);
        }
    }

    /* ---------------------------------------------------------------------- */

    playMusic(filePath) {
        const dispatcher = this.voiceConnection.playFile(filePath);

        if (this.leaveTimeout) {
            clearTimeout(this.leaveTimeout);
            this.leaveTimeout = null;
        }
        this.isPlaying = true;

        dispatcher.setVolume(this.volume);
        
        dispatcher.on("end", () => {
            MusicPlayer.onSongEnd(this);
        });
        dispatcher.on("error", e => {
            console.error(e);
        });
    }

    /* ---------------------------------------------------------------------- */

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

    enqueue(song) {
        // TODO
        console.log("Not implemented: enqueue " + song);
    }

    /* ---------------------------------------------------------------------- */

    disconnect() {
        if (this.voiceConnection) {
            this.voiceConnection.disconnect();
        }
        this.voiceConnection = null;
    }

}

/* ========================================================================== */

class MusicPlayerController {

    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.players = new Discord.Collection();

        this.constructor.instance = this;
    }

    /* ---------------------------------------------------------------------- */

    play(message, filePath) {
        // Terminate command early if the user is not in a voice channel.
        if (!message.member.voiceChannel) {
            return message.reply("you are not in a voice channel!");
        }

        const guildId = message.guild.id;

        let player = this.players.get(guildId);
        if (player && player.voiceConnection) {
            // There is already a player instance for this server.
            // Therefore, the bot should be connected to a voice channel in the
            // guild.
            // A sanity check (player.voiceConnection) is made, just in case.

            if (player.isPlaying) {
                if (player.voiceConnection.channel.id === message.member.voiceChannel.id) {
                    return player.enqueue(filePath);
                }

                return message.reply("you must be in the same voice channel I'm playing at the moment!");
            }
            
            player.play(message.member.voiceChannel, filePath);

        }
        else {
            // The bot is not in any voice channel in the server.
            // Create a new player instance.
            player = new MusicPlayer(guildId);
            this.players.set(guildId, player);

            player.play(message.member.voiceChannel, filePath);
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
