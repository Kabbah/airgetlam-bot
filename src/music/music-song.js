/* ========================================================================== */
/* CLASSE QUE REPRESENTA O VÍDEO DE UMA MÚSICA                                */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/02/02                                                           */
/* ========================================================================== */

const moment = require("moment");

/* ========================================================================== */

/** Esta classe define os atributos relevantes de uma música.
 */
class MusicSong {
    /** Construtor único. Inicializa os atributos.
     * @param {*} video dados do vídeo obtidos na consulta à API do YouTube.
     */
    constructor(video) {
        this.id = video.id.videoId;
        this.title = video.snippet.title;
        this.channelTitle = video.snippet.channelTitle;
        this.thumbnail = video.snippet.thumbnails.high.url;
        this.duration = null;
    }

    /* ---------------------------------------------------------------------- */

    /** Inicializa o atributo duration (pois é obtido em uma consulta separada).
     * @param {string} duration duracão da música no formato ISO 8601
     */
    setDuration(duration) {
        this.duration = moment.duration(duration);
    }
}

/* ========================================================================== */

module.exports = MusicSong;

/* ========================================================================== */
