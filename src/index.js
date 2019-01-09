const spotify = require("./spotify.js");
const web = require("./webserver.js");
const wss = require("./websocketserver.js");

// Webserver init
web.setAuthCallback(async (res) => {

    if ("error" in res) {
        console.log("Authentication error:", res.error);
        return;
    }

    if ("code" in res && "state" in res) {

        let success = await spotify.init(res.code, res.state);

        if (!success) {
            console.log("Failed to initialize spotify");
            return;
        }

        // Send nowplaying data to all clients periodically
        setInterval(async () => {
            let nowPlayingData = await spotify.tick();

            if (nowPlayingData != null) {
                wss.broadcast("now_playing", nowPlayingData);
            }
        }, 500);
    }
});
web.startListen();

wss.onConnect((ws) => {
    const queue = spotify.getQueue(10);

    ws.send("queue", queue);
});

wss.on("search", async (ws, query) => {

    let searchResult = await spotify.search(query);

    if (searchResult !== null) {
        ws.send("search_results", {
            query,
            results: searchResult
        });
    }
});

wss.on("addToQueue", (ws, uri) => {
    spotify.addToQueue(uri);
});

spotify.openAuthenticationWindow();

spotify.on("queue_changed", () => {
    wss.broadcast("queue", spotify.getQueue(10));
});