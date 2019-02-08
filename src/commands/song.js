const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "song",
    description: "Shows current song.",
    aliases: ["np", "current"],
    args: false,
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        const musicController = new MusicController();
        musicController.showCurrentSong(message);
    },
};
