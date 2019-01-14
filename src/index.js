const c = require("./colorprint");
const WebSocketServer = require("./WebSocketServer");
const WebServer = require("./WebServer");
const Spotify = require("./spotify");
const uuidv4 = require("uuid/v4");

const webServer = new WebServer(80);
const webSocketServer = new WebSocketServer();

const SPOTIFY_TICK_TIMER = 200;

const registeredUsers = {};
let nextUserID = 0;

function getUserDetails(client) {
    if (client.uuid in registeredUsers) {
        return registeredUsers[client.uuid];
    }
    return null;
}

function isClientRegistered(client) {
    return client.uuid in registeredUsers;
}

function onLoginSuccess(client) {
    const details = getUserDetails(client);
    client.send("loginSuccess", details.id);
    client.send("nowPlayingTrack", Spotify.nowPlaying());
    client.send("queue", Spotify.queue());
}

webSocketServer.onMessage("login", (client, providedUUID) => {
    // Generate UUID if client doesn't provide a valid one
    if (providedUUID === null || !(providedUUID in registeredUsers)) {
        client.uuid = uuidv4();
        client.send("uuid", client.uuid);
    } else {
        client.uuid = providedUUID;

        const user = registeredUsers[client.uuid];
        c.info(`${user.name} reconnected`);

        onLoginSuccess(client);
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
        registeredUsers[client.uuid] = {
            id: nextUserID++,
            name
        };

        c.info(`${name} connected`);
        onLoginSuccess(client);
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
    Spotify.addToQueue(uri, getUserDetails(client).id);
});

webSocketServer.onMessage("heart", async (client, uri) => {
    Spotify.heartTrack(uri, getUserDetails(client).id);
});

webSocketServer.onMessage("remove", async (client, uri) => {
    Spotify.removeTrack(uri, getUserDetails(client).id);
});

webServer.onAuth = async (code, state) => {
    if (!await Spotify.authenticate(code, state)) return;
    if (!await Spotify.init()) return;

    webSocketServer.start();

    let spotifyTickTimer = setTimeout(async function tick() {
        const tickData = await Spotify.tick();
        const success = (tickData !== null);

        if (success) {
            // On track change: tell clients about new track and queue
            const nowPlaying = Spotify.nowPlaying();
            if (tickData.trackHasChanged) {
                webSocketServer.broadcast("nowPlayingTrack", nowPlaying);
            }
            // Track hasn't changed, just send progress bar update
            else {
                webSocketServer.broadcast("progress", nowPlaying.progress);
            }
        }

        setTimeout(tick, SPOTIFY_TICK_TIMER);
    }, SPOTIFY_TICK_TIMER);
}

Spotify.onQueueChanged = () => {
    webSocketServer.broadcast("queue", Spotify.queue());
}

Spotify.openAuthenticationWindow();