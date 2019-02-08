const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "skip",
    description: "Skips current song.",
    args: false,
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        const musicController = new MusicController();
        musicController.skip(message);
    },
};
