const MusicController = require("../music/music-controller.js");

module.exports = {
    name: "queue",
    description: "Shows current song queue.",
    aliases: ["q", "que"],
    args: false,
    guildOnly: true,
    cooldown: 0,
    execute(message, args) {
        let page;
        if (!args || args.length === 0) {
            page = 1;
        }
        else {
            page = +args[0];
            if (isNaN(page) || page === 0 || page < 0) page = 1;
        }

        const musicController = new MusicController();
        musicController.showQueue(message, page);
    },
};
