const MusicController = require("../music/musiccontroller.js");

module.exports = {
    name: "play",
    description: "Plays a YouTube video.",
    aliases: ["p"],
    args: true,
    guildOnly: true,
    cooldown: 1,
    execute(message, args) {
        const musiccontroller = new MusicController();
        // musicplayer.play(message, "/home/victor/Music/Sen no Kiseki OST - Don't be Defeated by a Friend!.mp3");
        musiccontroller.play(message, args[0]);
    },
};
