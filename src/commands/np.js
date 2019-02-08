const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "np",
    description: "Shows current song.",
    aliases: ["current"],
    args: false,
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        const musicController = new MusicController();
        musicController.showCurrentSong(message);
    },
};
