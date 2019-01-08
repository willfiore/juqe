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

        setInterval(async () => {
            let nowPlayingData = await spotify.nowPlaying();

            if (nowPlayingData != null) {
                wss.broadcast("now_playing", nowPlayingData);
            }
        }, 1000);
    }
});
web.startListen();

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
    console.log(uri);
});

spotify.openAuthenticationWindow();