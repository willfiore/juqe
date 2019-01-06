const spotify = require("./spotify.js");
const web = require("./webserver.js");
const wss = require("./websocketserver.js");

// Webserver init
web.setAuthCallback((res) => {
    if ("error" in res) {
        console.log("Authentication error:", res.error);
    }

    if ("code" in res && "state" in res) {
        spotify.authenticate(res.code, res.state, (success)=> {
            if (success) {

                setInterval(spotify.nowPlaying.bind(null, (data) => {
                    wss.broadcast("now_playing", data);
                }), 1000);
            }
        });
    }
});
web.startListen();

wss.on("search", (ws, data) => {
    spotify.search(data, (res) => {
        ws.send("search_results", {
            query: data,
            results: res
        });
    });
});

spotify.openAuthenticationWindow();