/* ========================================================================== */
/* CLASSE QUE REPRESENTA O VÍDEO DE UMA MÚSICA                                */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/02/02                                                           */
/* ========================================================================== */

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
        this.thumbnail = video.snippet.thumbnails.default;
        this.duration = null;
    }

    /* ---------------------------------------------------------------------- */

    /** Inicializa o atributo duration (pois é obtido em uma consulta separada).
     * @param {string} duration duracão da música
     */
    setDuration(duration) {
        this.duration = duration;
    }
}

/* ========================================================================== */

module.exports = MusicSong;

/* ========================================================================== */
