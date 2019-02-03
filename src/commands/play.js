const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "play",
    description: "Plays a YouTube video.",
    aliases: ["p"],
    args: true,
    guildOnly: true,
    cooldown: 1,
    execute(message, args) {
        const musicController = new MusicController();
        musicController.play(message, args.join(" "));
    },
};
