const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const spotify = require("./spotify.js");

wss.on("connection", (ws) => {

    ws.sendRaw = ws.send.bind(ws);
    ws.send = function(key, data) {
        data = JSON.stringify(data);
        ws.sendRaw(key + "?" + data);
    }

    ws.on("message", (message) => {

        // Decode message w/ sanity checks
        if (message.indexOf("?") === -1) {
            return;
        }
        let key = message.substring(0, message.indexOf("?"));
        let data;

        try {
            data = JSON.parse(message.substring(message.indexOf("?") + 1));
        } catch(e) {
            return;
        }

        handleMessage(ws, key, data);
    });
});

function handleMessage(ws, key, data) {
    if (key === "search") {
        spotify.search(data, (res)=> {
            ws.send("search_results", {
                query: data,
                results: res
            });
        });
    }
}