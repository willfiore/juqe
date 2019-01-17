const c = require("./colorprint");
const WebSocketServer = require("./WebSocketServer");
const WebServer = require("./WebServer");
const Settings = require("./settings");
const Spotify = require("./spotify");
const uuidv4 = require("uuid/v4");

const webServer = new WebServer;
const webSocketServer = new WebSocketServer;

const SPOTIFY_TICK_TIMER = 200;

const registeredUsers = {};
let nextUserID = 0;

function getUserFromClient(client) {
    if (client.uuid in registeredUsers) {
        return registeredUsers[client.uuid];
    }
    return null;
}

function isClientRegistered(client) {
    return client.uuid in registeredUsers;
}

function onLoginSuccess(client) {
    const user = getUserFromClient(client);
    client.send("loginSuccess", user.id);
    client.send("nowPlayingTrack", Spotify.nowPlaying());
    client.send("queue", Spotify.queue());

    const userMap = {};
    for (uuid in registeredUsers) {
        const {id, ...userInfo} = registeredUsers[uuid];
        userMap[id] = userInfo;
    }
    webSocketServer.broadcast("users", userMap);
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
    Spotify.addToQueue(uri, getUserFromClient(client).id);
});

webSocketServer.onMessage("heart", async (client, uri) => {
    Spotify.heartTrack(uri, getUserFromClient(client).id);
});

webSocketServer.onMessage("remove", async (client, uri) => {
    Spotify.removeTrack(uri, getUserFromClient(client).id);
});

webServer.onAuth = async (code, state) => {

    console.log(code, state);

    if (!await Spotify.authenticate(code, state)) return;
    if (!await Spotify.init()) return;

    webSocketServer.start(Settings.settings.network.webSocketPort);

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

async function main() {

    if (!Settings.fileExists()) {
        c.info("Couldn't find settings file, creating one...");
        Settings.saveToFile();
    } else {
        c.success("Loaded settings from file");
        Settings.loadFromFile();
    }

    if (!Settings.settings.spotify.clientID || !Settings.settings.spotify.clientSecret) {
        c.error("Error: no Spotify Client ID or Secret supplied in settings.toml");
        return;
    }

    Spotify.setSpotifyCredentials(
        Settings.settings.spotify.clientID,
        Settings.settings.spotify.clientSecret
    );

    webServer.start(Settings.settings.network.webPort);
    Spotify.openAuthenticationWindow();
}

main();