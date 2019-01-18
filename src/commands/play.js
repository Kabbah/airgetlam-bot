const MusicPlayerController = require("../musicplayer.js");

module.exports = {
    name: "play",
    description: "Plays a fixed file.",
    guildOnly: true,
    cooldown: 1,
    execute(message, args) {
        // Singleton
        const musicplayer = new MusicPlayerController();
        musicplayer.play(message, "/home/victor/Music/Sen no Kiseki OST - Don't be Defeated by a Friend!.mp3");
    },
};
