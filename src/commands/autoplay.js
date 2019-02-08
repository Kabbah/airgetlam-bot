const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "autoplay",
    description: "Toggles autoplay mode. Autoplay mode continuously plays a related song after the previous song ends.",
    aliases: ["ap", "auto"],
    args: false,
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        const musicController = new MusicController();
        musicController.toggleAutoplay(message);
    },
};
