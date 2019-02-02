/* ========================================================================== */
/* CLASSE PRINCIPAL DO BOT                                                    */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const fs = require("fs");

const MusicController = require("./music/musiccontroller.js");

/* ========================================================================== */

// TODO: Colocar isso nas configurações
const commandsPath = "/src/commands";

/* ========================================================================== */

/**
 * Esta é a classe principal do bot, responsável por receber eventos de
 * mensagens e fazer o processamento de comandos.
 */
class AirgetlamBot {

    constructor() {
        /** Parâmetros de configuração. */
        this.config = require("./config.json");

        /** Cliente Discord do bot. */
        this.client = new Discord.Client();

        /** Estrutura de dados que armazena todos os comandos.
         * As chaves são o nome do comando, e o valor é igual ao module.exports
         * contido no arquivo do comando.
         */
        this.client.commands = new Discord.Collection();

        /** Estrutura de dados que armazena a lista de cooldowns de cada comando. */
        this.cooldowns = new Discord.Collection();

        process.on("SIGTERM", () => {
            const musiccontroller = new MusicController();
            musiccontroller.dropAllPlayers();

            this.client.destroy().then(process.exit, process.exit);
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Carrega e habilita todos os comandos contidos nos scripts .js no
     * diretório de comandos.
     */
    loadCommands() {
        const commandFiles = fs.readdirSync(this.config.basedir + commandsPath)
            .filter(file => file.endsWith(".js"));
        
        for (const file of commandFiles) {
            const command = require("./commands/" + file);
            this.client.commands.set(command.name, command);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Função executada quando o bot é lançado.
     */
    onceReady() {
        console.log("Ready!");
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Função chamada ao receber um evento "message", ou seja, quando um usuário
     * envia uma mensagem.
     * 
     * Features:
     *  - Processa apenas mensagens que iniciem com o prefixo do bot, e ignora
     * mensagens enviadas por outros bots.
     *  - Verifica nomes alternativos (aliases) de comandos.
     *  - Evita a execução de comandos "guild-only" em ambientes DM.
     *  - Verifica a existência de argumentos em comandos que exigem argumentos.
     *  - Gerencia o cooldown dos comandos.
     * 
     * @param {Discord.Message} message mensagem recebida
     */
    onMessage(message) {
        if (!message.content.startsWith(this.config.prefix) || message.author.bot) return;

        const args = message.content.slice(this.config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = this.client.commands.get(commandName) ||
                        this.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
    
        if (command.guildOnly && message.channel.type !== "text") {
            return message.reply("I can't execute that command inside DMs!");
        }
    
        if (command.args && !args.length) {
            let reply = "you didn't provide any arguments!";
            
            if (command.usage) {
                reply += "\nThe proper usage would be: " +
                         "`" + this.config.prefix + command.name + " " + command.usage + "`";
            }
    
            return message.reply(reply);
        }
    
        if (!this.cooldowns.has(command.name)) {
            this.cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || this.config.defaultCooldown) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply("please wait " + timeLeft.toFixed(1) + 
                                     " more second(s) before reusing the `" +
                                     command.name + "` command.");
            }
        }
    
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
            command.execute(message, args);
        }
        catch (err) {
            console.error(err);
            message.reply("there was an error trying to execute that command!");
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Inicializa o bot.
     */
    init() {
        this.loadCommands();

        this.client.once("ready", () => this.onceReady());
        this.client.on("message", message => this.onMessage(message));

        this.client.login(this.config.token);
    }

}

/* ========================================================================== */

module.exports = AirgetlamBot;

/* ========================================================================== */
