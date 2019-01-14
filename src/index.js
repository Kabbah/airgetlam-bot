const Discord = require("discord.js");

const config = require("./config.json");
const client = new Discord.Client();

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", message => {
    if (message.content.startsWith(config.prefix + "tbdc")) {
        message.channel.send("Thiago Bispo dá o cu.");
    }
    else if (message.content.startsWith(config.prefix + "jakubiak")) {
        message.channel.send("Bem entendido isso?");
    }
    else if (message.content === (config.prefix + "server")) {
        message.channel.send("Server name: " + message.guild.name +
                             "\nTotal members: " + message.guild.memberCount +
                             "\nCreated at: " + message.guild.createdAt +
                             "\nRegion: " + message.guild.region);
    }
    else if (message.content === config.prefix + "userinfo") {
        message.channel.send("Your username: " + message.author.username +
                             "\nYour ID: " + message.author.id);
    }
});

client.login(config.token);
