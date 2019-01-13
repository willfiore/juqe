export default class WebSocketClient {
    constructor(url) {

        this.messageHandlers = {};
        this.url = url;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.sendRaw = this.ws.send.bind(this.ws);
        this.ws.send = (key, data) => {
            this.ws.sendRaw(JSON.stringify({ key, data }));
        }

        this.ws.onmessage = (e) => {
            let key, data;

            try {
                const d = JSON.parse(e.data);
                key = d.key;
                data = d.data;
            } catch(err) {
                console.error(err);
                return;
            }

            if (key in this.messageHandlers) {
                this.messageHandlers[key](data);
            }
        }

        this.ws.onclose = (e) => {
            console.log(`Websocket disconnected: ${e.reason}. Reconnecting...`);
            setTimeout(() => {
                this.connect();
            }, 1000);
        }
    }

    onMessage(key, callback) {
        this.messageHandlers[key] = callback;
    }

    send(key, data) {
        this.ws.send(key, data);
    }
}

// let ws;
// let messageHandlers = {};
// let onOpenHandler = ()=>{};
// 
// export function send(key, data) {
//     ws.send(key, data);
// }
// 
// export function host() {
//     ws = new WebSocket("ws://" + location.host + ":8080");
// 
//     ws.sendRaw = ws.send.bind(ws);
//     ws.send = function(key, data) {
//         data = JSON.stringify(data);
//         ws.sendRaw(key + "?" + data);
//     }
// 
//     ws.onopen = (e) => {
//         onOpenHandler();
//     }
// 
//     ws.onmessage = (e) => {
//         // Decode message w/ sanity checks
//         if (e.data.indexOf("?") === -1) {
//             return;
//         }
// 
//         let key = e.data.substring(0, e.data.indexOf("?"));
//         let data;
// 
//         try {
//             data = JSON.parse(e.data.substring(e.data.indexOf("?") + 1));
//         } catch(err) {
//             return;
//         }
// 
//         handleMessage(key, data);
//     }
// }
// 
// export function onOpen(func) {
//     onOpenHandler = func;
// }
// 
// export function onMessage(key, func) {
//     messageHandlers[key] = func;
// }
// 
// function handleMessage(key, data) {
//     if (key in messageHandlers) {
//         messageHandlers[key](data);
//     }
// }