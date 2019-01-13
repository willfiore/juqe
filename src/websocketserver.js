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

// const WebSocket = require("ws");
// const wss = new WebSocket.Server({ port: 8080 });
// 
// let messageHandlers = {};
// let onConnect = ()=>{};
// 
// wss.on("connection", (ws) => {
// 
//     ws.sendRaw = ws.send.bind(ws);
//     ws.send = function(key, data) {
//         ws.sendRaw(JSON.stringify({ key, data }));
//     }
// 
//     ws.on("message", (message) => {
// 
//         // Decode message w/ sanity checks
//         if (message.indexOf("?") === -1) {
//             return;
//         }
//         let key = message.substring(0, message.indexOf("?"));
//         let data;
// 
//         try {
//             data = JSON.parse(message.substring(message.indexOf("?") + 1));
//         } catch(e) {
//             return;
//         }
// 
//         handleMessage(ws, key, data);
//     });
// 
//     onConnect(ws);
// });
// 
// exports.onConnect = (callback) => {
//     onConnect = callback;
// }
// 
// exports.on = (key, callback) => {
//     messageHandlers[key] = callback;
// }
// 
// exports.broadcast = (key, data) => {
//     wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(key, data);
//         }
//     });
// }
// 
// function handleMessage(ws, key, data) {
//     if (key in messageHandlers) {
//         messageHandlers[key](ws, data);
//     }
// }