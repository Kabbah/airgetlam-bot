const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "volume",
    description: "If no argument is specified, tells the current volume. If an argument is specified, sets the current volume.",
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        const musicController = new MusicController();
        if (!args || args.length === 0) {
            musicController.tellVolume(message);
            return;
        }

        const newVolume = Number(args[0]);
        musicController.setVolume(message, newVolume);
    },
};
