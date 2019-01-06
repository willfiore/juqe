let ws;
let messageHandlers = {};

export function send(key, data) {
    ws.send(key, data);
}

export function host() {
    ws = new WebSocket("ws://" + location.host + ":8080");

    ws.sendRaw = ws.send.bind(ws);
    ws.send = function(key, data) {
        data = JSON.stringify(data);
        ws.sendRaw(key + "?" + data);
    }

    ws.onopen = (e) => {
    }

    ws.onmessage = (e) => {
        // Decode message w/ sanity checks
        if (e.data.indexOf("?") === -1) {
            return;
        }

        let key = e.data.substring(0, e.data.indexOf("?"));
        let data;

        try {
            data = JSON.parse(e.data.substring(e.data.indexOf("?") + 1));
        } catch(err) {
            return;
        }

        handleMessage(key, data);
    }
}

export function on(key, func) {
    messageHandlers[key] = func;
}

function handleMessage(key, data) {
    if (key in messageHandlers) {
        messageHandlers[key](data);
    }
}
