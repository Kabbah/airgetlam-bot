const Discord = require("discord.js");

const config = require("./config.json");
const client = new Discord.Client();

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).split(" ");
    const command = args.shift().toLowerCase();

    if (command === "tbdc") {
        message.channel.send("Thiago Bispo dá o cu.");
    }
    else if (command === "jakubiak") {
        message.channel.send("Bem entendido isso?");
    }
    else if (command === "server") {
        message.channel.send("Server name: " + message.guild.name +
                             "\nTotal members: " + message.guild.memberCount +
                             "\nCreated at: " + message.guild.createdAt +
                             "\nRegion: " + message.guild.region);
    }
    else if (command === "userinfo") {
        message.channel.send("Your username: " + message.author.username +
                             "\nYour ID: " + message.author.id);
    }
    else if (command === "argsinfo") {
        if (!args.length) {
            return message.channel.send("You didn't provide any arguments, " + message.author + "!");
        }
        else if (args[0] === "foo") {
            return message.channel.send("bar");
        }
    
        message.channel.send("First argument: " + args[0]);
    }
});

client.login(config.token);
