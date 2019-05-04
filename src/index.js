/* ========================================================================== */
/* SCRIPT PARA LANÇAR O BOT                                                   */
/* -------------------------------------------------------------------------- */
/* Autor: Victor Barpp Gomes                                                  */
/* Data: 2019/01/14                                                           */
/* ========================================================================== */

try {
    const AirgetlamBot = require("./bot.js");
    
    const bot = new AirgetlamBot();
    bot.init();
}
catch (err) {
    console.error(err);
    console.log("Oops, an error occurred.\n" + 
        "This usually happens when you forget to set up your config.json. " +
        "To fix this, please rename example_config.json to config.json and " +
        "set your Discord token and YouTube API key there.");
}

/* ========================================================================== */
