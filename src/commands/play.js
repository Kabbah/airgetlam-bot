const MusicController = require("../music/musiccontroller.js");

module.exports = {
    name: "play",
    description: "Plays a YouTube video.",
    args: true,
    guildOnly: true,
    cooldown: 1,
    execute(message, args) {
        // Singleton
        const musicplayer = new MusicController();
        // musicplayer.play(message, "/home/victor/Music/Sen no Kiseki OST - Don't be Defeated by a Friend!.mp3");
        musicplayer.play(message, args[0]);
    },
};
