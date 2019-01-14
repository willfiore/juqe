const c = require("./colorprint");
const WebSocketServer = require("./WebSocketServer");
const WebServer = require("./WebServer");
const Spotify = require("./spotify");
const uuidv4 = require("uuid/v4");

const webServer = new WebServer(80);
const webSocketServer = new WebSocketServer();

const SPOTIFY_TICK_TIMER = 200;
const SPOTIFY_QUEUE_SEND_SIZE = 15;

const registeredUsers = {};

function getClientName(client) {
    if (client.uuid in registeredUsers) {
        return registeredUsers[client.uuid].name;
    }
    return null;
}

function isClientRegistered(client) {
    return client.uuid in registeredUsers;
}

webSocketServer.onOpen = (client) => {
    client.send("nowPlayingTrack", Spotify.nowPlaying());
    client.send("queue", Spotify.queue(SPOTIFY_QUEUE_SEND_SIZE));
}

webSocketServer.onMessage("uuid", (client, uuid) => {
    // Generate UUID if client doesn't provide a valid one
    if (uuid === null || !(uuid in registeredUsers)) {
        client.uuid = uuidv4();
        client.send("uuid", client.uuid);
    } else {
        client.uuid = uuid;

        const name = registeredUsers[client.uuid].name;
        c.info(`${name} reconnected`);
        client.send("loginSuccess", name);
    }
});

webSocketServer.onMessage("name", (client, name) => {
    // Don't let clients break the character limit
    name = name.substr(0, 32);

    if (client.uuid === null) {
        c.error(`Received name ${name} from null UUID client`);
        return;
    }

    // Register the user
    const user = registeredUsers[client.uuid];

    if (user === undefined) {
        registeredUsers[client.uuid] = { name };
        c.info(`${name} connected`);
        client.send("loginSuccess", name);
    }
    // Uncomment to enable renaming
    // else {
    //     c.info(`${user.name} renamed to ${name}`);
    //     user.name = name;
    // }
});

webSocketServer.onMessage("search", async (client, query) => {
    if (!isClientRegistered(client)) return;
    // c.info(`${getClientName(client)} searched for "${query}"`);
    const results = await Spotify.search(query);
    client.send("searchResults", results);
});

webSocketServer.onMessage("addToQueue", async (client, uri) => {
    if (!isClientRegistered(client)) return;
    Spotify.addToQueue(uri);
});

webServer.onAuth = async (code, state) => {
    if (!await Spotify.authenticate(code, state)) return;
    if (!await Spotify.init()) return;

    webSocketServer.start();

    let oldUri = null;
    let spotifyTickTimer = setTimeout(async function tick() {
        const success = await Spotify.tick();

        if (success) {
            // On track change: tell clients about new track and queue
            const nowPlaying = Spotify.nowPlaying();
            if (oldUri !== nowPlaying.uri) {
                webSocketServer.broadcast("nowPlayingTrack", nowPlaying);
                oldUri === nowPlaying.uri;
            }
            // Track hasn't changed, just send progress bar update
            else {
                webSocketServer.broadcast("progress", data.nowPlaying.progress);
            }
        }

        setTimeout(tick, SPOTIFY_TICK_TIMER);
    }, SPOTIFY_TICK_TIMER);
}

Spotify.onQueueChanged = () => {
    webSocketServer.broadcast("queue", Spotify.queue(SPOTIFY_QUEUE_SEND_SIZE));
}

Spotify.openAuthenticationWindow();