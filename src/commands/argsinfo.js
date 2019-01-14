module.exports = {
    name: "argsinfo",
    description: "Tests argument parsing.",
    execute(message, args) {
        if (!args.length) {
            return message.channel.reply("you didn't provide any arguments!");
        }
        else if (args[0] === "foo") {
            return message.channel.send("bar");
        }
    
        message.channel.send("First argument: " + args[0]);
    },
};
