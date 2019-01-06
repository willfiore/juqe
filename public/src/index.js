import * as WebSocket from "./websocket.js";
import * as UI from "./ui.js";

WebSocket.host();
UI.render();

UI.setSearchQueryCallback((query) => {
    WebSocket.send("search", query);
});

WebSocket.on("search_results", (data) => {
    UI.setSearchResults(data);
});

WebSocket.on("now_playing", (data) => {
    UI.setNowPlaying(data);
});