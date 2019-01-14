module.exports = {
    name: "argsinfo",
    description: "Tests argument parsing.",
    args: true,
    usage: "<arg>",
    execute(message, args) {
        if (args[0] === "foo") {
            return message.channel.send("bar");
        }
    
        message.channel.send("First argument: " + args[0]);
    },
};
