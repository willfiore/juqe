const WebSocketServer = require("./WebSocketServer");
const WebServer = require("./WebServer");
const Spotify = require("./spotify");

const webServer = new WebServer(80);
const webSocketServer = new WebSocketServer();

const SPOTIFY_TICK_TIMER = 200;
const SPOTIFY_QUEUE_SEND_SIZE = 15;

webSocketServer.onOpen = (client) => {
    client.send("nowPlayingTrack", Spotify.nowPlaying());
    client.send("queue", Spotify.queue(SPOTIFY_QUEUE_SEND_SIZE));
}

webSocketServer.onMessage("search", async (client, query) => {
    const results = await Spotify.search(query);
    client.send("searchResults", results);
});

webSocketServer.onMessage("addToQueue", async (client, uri) => {
    Spotify.addToQueue(uri);
});

webServer.onAuth = async (code, state) => {
    if (!await Spotify.authenticate(code, state)) return;
    if (!await Spotify.init()) return;

    webSocketServer.start();

    let oldUri = null;
    let spotifyTickTimer = setTimeout(async function tick() {
        const success = await Spotify.tick();

        if (success) {
            // On track change: tell clients about new track and queue
            const nowPlaying = Spotify.nowPlaying();
            if (oldUri !== nowPlaying.uri) {
                webSocketServer.broadcast("nowPlayingTrack", nowPlaying);
                oldUri === nowPlaying.uri;
            }
            // Track hasn't changed, just send progress bar update
            else {
                webSocketServer.broadcast("progress", data.nowPlaying.progress);
            }
        }

        setTimeout(tick, SPOTIFY_TICK_TIMER);
    }, SPOTIFY_TICK_TIMER);
}

Spotify.onQueueChanged = () => {
    webSocketServer.broadcast("queue", Spotify.queue(SPOTIFY_QUEUE_SEND_SIZE));
}

Spotify.openAuthenticationWindow();

// const spotify = require("./spotify.js");
// 
// import WebServer from "./WebServer.mjs";
// 
// const wss = require("./websocketserver.js");
// const uuidv4 = require("uuid/v4");
// 
// const webServer = WebServer(80);
// 
// // Webserver init
// web.setAuthCallback(async (res) => {
// 
//     if ("error" in res) {
//         console.log("Authentication error:", res.error);
//         return;
//     }
// 
//     if ("code" in res && "state" in res) {
// 
//         let success = await spotify.init(res.code, res.state);
// 
//         if (!success) {
//             console.log("Failed to initialize spotify");
//             return;
//         }
// 
//         // Send nowplaying data to all clients periodically
//         setInterval(async () => {
//             let nowPlayingData = await spotify.tick();
// 
//             if (nowPlayingData != null) {
//                 wss.broadcast("now_playing", nowPlayingData);
//             }
//         }, 500);
//     }
// });
// web.startListen();
// 
// wss.onConnect((ws) => {
//     const queue = spotify.getQueue(10);
//     ws.send("queue", queue);
// });
// 
// wss.on("search", async (ws, query) => {
// 
//     let searchResult = await spotify.search(query);
// 
//     if (searchResult !== null) {
//         ws.send("search_results", {
//             query,
//             results: searchResult
//         });
//     }
// });
// 
// wss.on("addToQueue", (ws, uri) => {
//     spotify.addToQueue(uri);
// });
// 
// spotify.openAuthenticationWindow();
// 
// spotify.on("queue_changed", () => {
//     wss.broadcast("queue", spotify.getQueue(10));
// });