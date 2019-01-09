import * as WebSocket from "./websocket.js";
import * as UI from "./ui.js";

WebSocket.host();
UI.render();

UI.setCallback("searchQuery", (query) => {
    WebSocket.send("search", query);
});

UI.setCallback("addToQueue", (uri) => {
    WebSocket.send("addToQueue", uri);
});

WebSocket.on("search_results", (data) => {
    UI.setSearchResults(data);
});

WebSocket.on("now_playing", (data) => {
    UI.setNowPlaying(data);
});

WebSocket.on("queue", (queue) => {
    UI.setQueue(queue);
});