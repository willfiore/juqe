const WebSocket = require("ws");

module.exports = class WebSocketServer {
    constructor() {

        this.messageHandlers = {};
    }

    start() {
        this.wss = new WebSocket.Server({port: 8080});

        this.wss.on("connection", (client) => {

            client.sendRaw = client.send.bind(client);
            client.send = function (key, data) {
                client.sendRaw(JSON.stringify({key, data}));
            }

            client.onmessage = (e) => {
                let key, data;

                try {
                    const d = JSON.parse(e.data);
                    key = d.key;
                    data = d.data;
                } catch (err) {
                    console.error(err);
                    return;
                }

                if (key in this.messageHandlers) {
                    this.messageHandlers[key](client, data);
                }
            }

            this.onOpen(client);
        });
    }

    broadcast(key, data) {
        this.wss.clients.forEach((client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(key, data);
            }
        }));
    }

    // Override
    onOpen(client) {};

    onMessage(key, callback) {
        this.messageHandlers[key] = callback;
    }
}