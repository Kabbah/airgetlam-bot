/* ========================================================================== */
/* CLASSE PRINCIPAL DO BOT                                                    */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const fs = require("fs");

/* ========================================================================== */

const commandsPath = "/src/commands";

/* ========================================================================== */

class ValimarBot {
    constructor() {
        this.config = require("./config.json");
        this.client = new Discord.Client();
        this.client.commands = new Discord.Collection();
        this.cooldowns = new Discord.Collection();

        process.on("SIGTERM", () => {
            const MusicPlayerController = require("./musicplayer.js");
            (new MusicPlayerController()).dropAllPlayers();

            this.client.destroy().then(process.exit, process.exit);
        });
    }

    /* ---------------------------------------------------------------------- */

    loadCommands() {
        const commandFiles = fs.readdirSync(this.config.basedir + commandsPath)
                               .filter(file => file.endsWith(".js"));
        
        for (const file of commandFiles) {
            const command = require("./commands/" + file);
            this.client.commands.set(command.name, command);
        }
    }

    /* ---------------------------------------------------------------------- */

    onceReady() {
        console.log("Ready!");
    }

    /* ---------------------------------------------------------------------- */

    onMessage(message) {
        // Ignora mensagens que não começam com o prefixo configurado ou
        // enviadas por bots.
        if (!message.content.startsWith(this.config.prefix) || message.author.bot) return;

        // Separa o comando dos argumentos, e obtém o comando, caso exista,
        // verificando aliases.
        const args = message.content.slice(this.config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = this.client.commands.get(commandName) ||
                        this.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
    
        // Bloqueia comandos "server-only" em mensagens privadas.
        if (command.guildOnly && message.channel.type !== "text") {
            return message.reply("I can't execute that command inside DMs!");
        }
    
        // Identifica erros de falta de argumentos em comandos que precisam de
        // argumentos.
        if (command.args && !args.length) {
            let reply = "you didn't provide any arguments!";
            
            if (command.usage) {
                reply += "\nThe proper usage would be: " +
                         "`" + this.config.prefix + command.name + " " + command.usage + "`";
            }
    
            return message.reply(reply);
        }
    
        // Gerencia cooldowns de uso de comandos
        if (!this.cooldowns.has(command.name)) {
            this.cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || this.config.defaultCooldown) * 1000;
        
        // Se o usuário já utilizou o comando recentemente, verifica se ainda
        // está no período de cooldown, e responde adequadamente.
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply("please wait " + timeLeft.toFixed(1) + 
                                     " more second(s) before reusing the `" +
                                     command.name + "` command.");
            }
        }
    
        // Por fim, adiciona-se um cooldown ao par usuário/comando. Coloca-se,
        // também, um timer para retirar o usuário da lista de cooldowns depois
        // que terminar o tempo.
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // Agora pode-se executar o comando.
        try {
            command.execute(message, args);
        }
        catch (err) {
            console.error(err);
            message.reply("there was an error trying to execute that command!");
        }
    }

    /* ---------------------------------------------------------------------- */

    init() {
        this.loadCommands();

        this.client.once("ready", () => this.onceReady());
        this.client.on("message", message => this.onMessage(message));

        this.client.login(this.config.token);
    }

}

/* ========================================================================== */

module.exports = ValimarBot;

/* ========================================================================== */
