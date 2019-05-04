/* ========================================================================== */
/* CLASSE PRINCIPAL DO BOT                                                    */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

const MusicController = require("./music/music-controller.js");

/* ========================================================================== */

const commandsPath = "commands";

/* ========================================================================== */

/**
 * Esta é a classe principal do bot, responsável por receber eventos de
 * mensagens e fazer o processamento de comandos.
 */
class AirgetlamBot {

    constructor() {
        /** Parâmetros de configuração. */
        this.config = require("./config.json");

        /** Prefixo dos comandos. */
        this.prefix = this.config.discord.commands.prefix;

        /** Cliente Discord do bot. */
        this.client = new Discord.Client();

        /** Estrutura de dados que armazena todos os comandos.
         * As chaves são o nome do comando, e o valor é igual ao module.exports
         * contido no arquivo do comando.
         */
        this.client.commands = new Discord.Collection();

        /** Estrutura de dados que armazena a lista de cooldowns de cada
         * comando.
         */
        this.cooldowns = new Discord.Collection();

        for (const signal of ["SIGTERM", "SIGINT"]) {
            process.on(signal, () => {
                const musiccontroller = new MusicController();
                musiccontroller.dropAllPlayers();
                
                this.client.destroy()
                    .then(() => process.exit(0))
                    .catch(() => process.exit(1));
            });
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

        this.client.login(this.config.discord.token).catch(err => {
            console.error(err);
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Carrega e habilita todos os comandos contidos nos scripts .js no
     * diretório de comandos.
     */
    loadCommands() {
        const commandFiles = fs.readdirSync(path.resolve(__dirname, commandsPath))
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
        console.log("Airgetlam is ready!");
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
        if (!this.isMessageValid(message)) return;

        const { commandName, args } = this.extractCommandAndArgs(message);
        const command = this.getCommandByNameOrAlias(commandName);
        if (!command) return;
    
        if (command.guildOnly && message.channel.type !== "text") {
            message.reply("I can't execute that command inside DMs!");
            return;
        }
    
        if (command.args && !args.length) {
            let reply = "you didn't provide any arguments!";
            
            if (command.usage) {
                reply += "\nThe proper usage would be: `"
                        + this.prefix + command.name + " " + command.usage + "`";
            }
    
            message.reply(reply);
            return;
        }
        
        const timeLeft = this.cooldownJob(command, message);
        if (timeLeft > 0) {
            message.reply("please wait " + timeLeft.toFixed(1) + 
                    " more second(s) before reusing the `" + command.name +
                    "` command.");
            return;
        }

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
     * Verifica se uma mensagem é válida para este bot.
     * @return {boolean} true se e somente se a mensagem contém o prefixo
     * configurado e não foi enviada por um bot
     */
    isMessageValid(message) {
        if (message.author.bot) return false;
        return message.content.startsWith(this.prefix);
    }
    
    /* ---------------------------------------------------------------------- */
    
    /**
     * Extrai o comando e os argumentos de uma mensagem.
     * @return objeto cuja chave 'commandName' contém o nome do comando (string)
     * e a chave 'args' contém um vetor de argumentos (string[])
     */
    extractCommandAndArgs(message) {
        const args = message.content.slice(this.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        return { commandName: commandName, args: args };
    }
    
    /* ---------------------------------------------------------------------- */
    
    /**
     * Obtém o module.exports de um comando a partir de seu nome. Também busca
     * por aliases.
     * @return objeto do comando, ou null se não existir
     */
    getCommandByNameOrAlias(name) {
        const cmdList = this.client.commands;
        return cmdList.get(name) || cmdList.find(cmd => cmd.aliases && cmd.aliases.includes(name));
    }
    
    /* ---------------------------------------------------------------------- */
    
    /**
     * Verifica se o autor da mensagem está no cooldown para o comando.
     * Se estiver, retorna o tempo em segundos para que termine o cooldown.
     * Senão, inicia um novo cooldown e retorna -1 (simbolizando que o autor
     * pode usar o comando).
     * @return {Number} tempo em segundos para terminar o cooldown do comando,
     * ou -1, caso não esteja em cooldown
     */
    cooldownJob(command, message) {
        if (!this.cooldowns.has(command.name)) {
            this.cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownMs = 1000 * 
            (command.cooldown || this.config.discord.commands.defaultCooldown);
        
        const authorId = message.author.id;
        if (timestamps.has(authorId)) {
            const expirationTime = timestamps.get(authorId) + cooldownMs;
    
            if (now < expirationTime) {
                return (expirationTime - now) / 1000;
            }
        }
        
        timestamps.set(authorId, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownMs);
        
        return -1;
    }

}

/* ========================================================================== */

module.exports = AirgetlamBot;

/* ========================================================================== */
