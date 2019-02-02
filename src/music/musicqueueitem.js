/* ========================================================================== */
/* CLASSE QUE REPRESENTA UM ITEM DE FILA DE MÚSICAS                           */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/02/02                                                           */
/* ========================================================================== */

const Discord = require("discord.js");

/* ========================================================================== */

/** Esta classe representa um item de uma fila de músicas. Foi implementada
 * dessa maneira para possibilitar que outros atributos sejam adicionados com
 * facilidade.
 */
class MusicQueueItem {
    /** Construtor único. Inicializa os atributos.
     * @param {Discord.GuildMember} member usuário que solicitou a música
     * @param {string} song nome da música solicitada
     */
    constructor(member, song) {
        this.userId = member.id;
        this.userDisplayName = member.displayName;
        this.userDisplayAvatarUrl = member.user.displayAvatarURL;
        this.song = song;
    }
}

/* ========================================================================== */

module.exports = MusicQueueItem;

/* ========================================================================== */
