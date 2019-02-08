/* ========================================================================== */
/* CLASSE QUE REPRESENTA UM ITEM DE FILA DE MÚSICAS                           */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/02/02                                                           */
/* ========================================================================== */

const Discord = require("discord.js");

const MusicSong = require("./music-song.js");

/* ========================================================================== */

/** Esta classe representa um item de uma fila de músicas. Foi implementada
 * dessa maneira para possibilitar que outros atributos sejam adicionados com
 * facilidade.
 */
class MusicQueueItem {
    /** Construtor único. Inicializa os atributos.
     * @param {Discord.GuildMember} member usuário que solicitou a música
     * @param {MusicSong} song nome da música solicitada
     */
    constructor(member, song) {
        this.user = {
            id: (member)? member.id : null,
            displayName: (member)? member.displayName : null,
            displayAvatarUrl: (member)? member.user.displayAvatarURL : null,
        };
        this.song = song;
    }
}

/* ========================================================================== */

module.exports = MusicQueueItem;

/* ========================================================================== */
