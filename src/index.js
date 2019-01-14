const Discord = require("discord.js");
const fs = require("fs");

const config = require("./config.json");

const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(config.basedir + "/src/commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require("./commands/" + file);
    client.commands.set(command.name, command);
}

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute(message, args);
    }
    catch (err) {
        console.error(err);
        message.reply("there was an error trying to execute that command!");
    }
});

client.login(config.token);
