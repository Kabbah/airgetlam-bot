module.exports = {
    name: "userinfo",
    description: "Prints user information.",
    execute(message, args) {
        message.channel.send("Your username: " + message.author.username +
                             "\nYour ID: " + message.author.id);
    },
};
