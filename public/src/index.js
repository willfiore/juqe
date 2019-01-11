import * as WebSocket from "./websocket.js";
import * as UI from "./ui.js";

WebSocket.host();
UI.render();

UI.on("searchQuery", (query) => {
    WebSocket.send("search", query);
});

UI.on("addToQueue", (uri) => {
    WebSocket.send("addToQueue", uri);
});

UI.on("heart", (uri) => {
    WebSocket.send("heart", uri);
})

WebSocket.on("search_results", (data) => {
    UI.setSearchResults(data);
});

WebSocket.on("now_playing", (data) => {
    UI.setNowPlaying(data);
});

WebSocket.on("queue", (queue) => {
    UI.setQueue(queue);
});