module.exports = {
    name: "call",
    description: "Calls a user.",
    guildOnly: true,
    execute(message, args) {
        if (!message.mentions.users.size) {
            return message.reply("you need to tag a user in order to call them!");
        }
        const taggedUser = message.mentions.users.first();
    
        message.channel.send("Hey " + taggedUser.username + "!!!");
    }
};
