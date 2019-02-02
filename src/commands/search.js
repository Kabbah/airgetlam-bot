const { google } = require("googleapis");
const config = require("../config.json");
const youtube = google.youtube({
    version: "v3",
    auth: config.youtube.key,
});

async function doSearch(query) {
    const searchResponse = await youtube.search.list({
        part: "snippet",
        type: "video",
        q: query,
        maxResults: config.youtube.maxResults,
        regionCode: config.youtube.regionCode,
    });

    let ids = [];
    for (const item of searchResponse.data.items) {
        ids.push(item.id.videoId);
        console.log(item.id.videoId);
        console.log(item.snippet.title);
        console.log(item.snippet.channelTitle);
        console.log(item.snippet.thumbnails);
        console.log();
    }
    
    const videoDetails = await youtube.videos.list({
        part: "contentDetails",
        id: ids.join(","),
    });

    for (const item of videoDetails.data.items) {
        console.log(item.id);
        console.log(item.contentDetails.duration);
        console.log();
    }
}

module.exports = {
    name: "search",
    description: "DEBUG: search a youtube video.",
    aliases: ["p"],
    args: true,
    guildOnly: true,
    cooldown: 1,
    execute(message, args) {
        doSearch(args.join(" ")).catch(console.error);
    },
};
