const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const spotify = require("./spotify.js");

let messageHandlers = {};

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

exports.on = (key, callback) => {
    messageHandlers[key] = callback;
}

exports.broadcast = (key, data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(key, data);
        }
    });
}

function handleMessage(ws, key, data) {
    if (key in messageHandlers) {
        messageHandlers[key](ws, data);
    }
}