const c = require("./colorprint");
const crypto = require("crypto");
const opn = require("opn");
const querystring = require("querystring");
const request = require("./request-promise");
const url = require("url");
const util = require("./utility");

const REDIRECT_URI = "http://localhost/auth/";
const REALTIME_PLAYLIST_NAME = "04bf6f70ee7683db";
const AUTH_STATE = crypto.randomBytes(16).toString("hex");

const global = {
    authenticated: false,
    spotifyClientID: "",
    spotifyClientSecret: "",
    authData: {},
    nowPlaying: {},
    realtimePlaylistID: null,
    userQueue: [],
    fallbackQueue: [],
    uriCache: {}
};

function nextTrackInQueue() {
    if (global.userQueue.length > 0) {
        return global.userQueue[0];
    }

    if (global.fallbackQueue.length > 0) {
        return global.fallbackQueue[0];
    }

    return null;
}

function shiftQueue() {
    if (global.userQueue.length > 0) {
        return global.userQueue.shift();
    }
    else if (global.fallbackQueue.length > 0) {
        return global.fallbackQueue.shift();
    }

    return null;
}

function reorderQueue() {
    global.userQueue.sort((a, b) => {
        if (a.hearts.length > b.hearts.length) return -1;
        if (a.hearts.length < b.hearts.length) return 1;

        if (a.timestamp < b.timestamp) return -1;
        if (a.timestamp > b.timestamp) return 1;

        return 0;
    });
}

async function spotifyApi(uriStem, options) {

    const fullOptions = Object.assign({
        uri: `https://api.spotify.com/v1/${uriStem}`,
        headers: {
            "Authorization": `Bearer ${global.authData.access_token}`
        }
    }, options);

    return request(fullOptions);
}

module.exports.setSpotifyCredentials = (id, secret) => {
    global.spotifyClientID = id;
    global.spotifyClientSecret = secret;
}

module.exports.openAuthenticationWindow = () => {
    let uri = "https://accounts.spotify.com/authorize/";
    uri += "?" + querystring.stringify({
        client_id: global.spotifyClientID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        state: AUTH_STATE,
        scope: "user-modify-playback-state playlist-modify-private playlist-read-private user-read-playback-state user-read-private streaming",
        //show_dialog: "true",
    });

    opn(uri);
}

module.exports.authenticate = async (code, state) => {

    if (global.authenticated) {
        return false;
    }

    if (state != AUTH_STATE) {
        c.error("Failed to authenticate with Spotify: invalid state returned");
        return false;
    }

    const res = await request({
        uri: "https://accounts.spotify.com/api/token/",
        method: "POST",
        form: {
            client_id: global.spotifyClientID,
            client_secret: global.spotifyClientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
        }
    });

    if (res.statusCode !== 200) {
        c.error(`Failed to authenticate with Spotify: ${res.statusCode}, ${res.body}`);
        return false;
    }

    global.authData = JSON.parse(res.body);
    c.success("Successfully authenticated with Spotify");

    setTimeout(function tick() {
        refreshAccessToken();
        setTimeout(tick, 0.8 * global.authData.expires_in * 1000);
    }, 0.8 * global.authData.expires_in * 1000);

    global.authenticated = true;
    return true;
}

async function refreshAccessToken() {
    const res = await request({
        uri: "https://accounts.spotify.com/api/token/",
        method: "POST",
        form: {
            client_id: global.spotifyClientID,
            client_secret: global.spotifyClientSecret,
            grant_type: "refresh_token",
            refresh_token: global.authData.refresh_token
        }
    });

    if (res.statusCode !== 200) {
        c.error(`Error refreshing access token: ${res.statusCode}, ${res.body}`);
        return null;
    }

    global.authData = Object.assign(global.authData, JSON.parse(res.body));
}

// async function refreshAccessToken(refresh_token) {
//     let res = await request.post("https://accounts.spotify.com/api/token/", {
//         form: {
//             client_id: CLIENT_ID,
//             client_secret: CLIENT_SECRET,
//             grant_type: "refresh_token",
//             refresh_token: refresh_token,
//         }
//     });
// 
//     if (res.statusCode !== 200) {
//         console.log("Error refreshing access token:", res.statusCode, res.body);
//         return null;
//     }
// 
//     authData = Object.assign(authData, JSON.parse(res.body));
// }
// 

async function getRealtimePlaylistID() {
    // Search user's playlists to see if realtime playlist already exists
    const res = await spotifyApi("me/playlists", {
        qs: {
            limit: 50,
            market: "from_token"
        }
    });

    if (res.statusCode !== 200) {
        c.error(`Error retrieving user's playlists: ${res.statusCode}, ${res.body}`);
        return null;
    }

    const playlists = JSON.parse(res.body);
    const realtimePlaylist = playlists.items.find(
        p => p.name === REALTIME_PLAYLIST_NAME);

        if (realtimePlaylist !== undefined) {
            c.success("Found existing Juqe realtime playlist in library");
            return realtimePlaylist.id;
        }
        // Create the playlist -- it doesn't exist
        else {
            c.info("Realtime playlist doesn't exist, creating it...");

            const res = await spotifyApi("me/playlists", {
                method: "POST",
                json: {
                    name: REALTIME_PLAYLIST_NAME,
                    public: false,
                    // description: "Auto-generated realtime playlist for Juqe"
                }
            });

            if (res.statusCode !== 200 && res.statusCode !== 201) {
                c.error(`Error creating realtime playlist: ${res.statusCode}, ${res.body}`);
                return null;
            }

            c.success(`Successfully created realtime playlist`);
            return res.body.id;
        }
}

async function updateRealtimePlaylistTrack() {

    const next = nextTrackInQueue();

    if (next === null) {
        c.error("Can't set realtime playlist track: no songs in queue!");
        return false;
    }

    const res = await spotifyApi(`playlists/${global.realtimePlaylistID}/tracks`, {
        method: "PUT",
        qs: { uris: next.uri }
    });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
        c.error(`Error setting realtime playlist tracks: ${res.statusCode}, ${res.body})`);
        return false;
    }

    return true;
}

async function getPlaylistTracks(playlistID) {
    // Check if the playlist exists (and get its name)
    const res = await spotifyApi(`playlists/${playlistID}`, {
        qs: { fields: "name" },
        market: "from_token"
    });

    if (res.statusCode !== 200) {
        c.error(`Error loading playlist: ${res.statusCode}, ${res.body}`);
        return null;
    }

    const playlistName = JSON.parse(res.body).name;

    // Load its tracks
    let tracks = [];

    let qs = { fields: "next,items(track(name,uri,artists))" };
    do {
        const res = await spotifyApi(`playlists/${playlistID}/tracks`, { qs });

        if (res.statusCode !== 200) {
            c.error(`Error loading playlist tracks chunk: ${res.statusCode}, ${res.body}`);
            return null;
        }

        const data = JSON.parse(res.body);

        tracks = tracks.concat(data.items.map(t => ({
            name: t.track.name,
            artist: t.track.artists.map(a => a.name).join(", "),
            uri: t.track.uri
        })));

        const next = data.next;

        if (next === null) {
            qs = null;
        } else {
            qs = url.parse(next, true).query;
        }

    } while (qs !== null);

    // Remove invalid tracks (local)
    tracks = tracks.filter((track) => {
        return track.uri.startsWith("spotify:track:");
    });

    c.success(`Loaded ${tracks.length} tracks from playlist "${playlistName}"`);
    return tracks;
}

async function getNowPlayingInfo() {
    const res = await spotifyApi("me/player/currently-playing", {
        market: "from_token"
    });

    if (res.statusCode === 204) {
        c.error("Failed to get now playing info: Can't find any devices playing Spotify. (Are you in a private session?)");
        return null;
    }
    else if (res.statusCode !== 200) {
        c.error(`Failed to get now playing info: ${res.statusCode}, ${res.body}`);
        return null;
    }

    const data = JSON.parse(res.body);

    let ret = {};

    try {
        ret = {
            name: data.item.name,
            artist: data.item.artists.map(a => a.name).join(", "),
            uri: data.item.uri,
            progress: (data.progress_ms / data.item.duration_ms),
            album_art: data.item.album.images[0].url
        }
    } catch(e) {
        console.log(e);
        console.log(data);
    }

    return ret;
}

module.exports.init = async () => {

    global.realtimePlaylistID = await getRealtimePlaylistID();
    if (global.realtimePlaylistID === null) return false;

    let fallbackPlaylistTracks = await getPlaylistTracks("37i9dQZEVXcDmnp4MUjGae");
    if (fallbackPlaylistTracks === null) return false;

    global.fallbackQueue = fallbackPlaylistTracks;
    util.shuffleArray(global.fallbackQueue);

    await updateRealtimePlaylistTrack();

    // NOTE: For now, don't start the playlist automatically. Playback started
    // this way (through the Web API) does not correctly select the context in
    // the Spotify client, so future songs added to the playlist are not correctly
    // queued.
    // https://github.com/spotify/web-api/issues/537

    // Just tell the user to start the playlist instead:
    c.info(`Ready. Start the ${REALTIME_PLAYLIST_NAME} playlist in Spotify to begin.`);

    return true;
}

module.exports.search = async (query) => {
    const res = await spotifyApi("search", {
        qs: {
            q: `${query}*`,
            type: "track",
            market: "from_token",
            limit: 20,
        }
    });

    if (res.statusCode !== 200) {
        c.error(`Error searching for ${query}: ${res.statusCode}, ${res.body}`);
        return null;
    }

    const rawData = JSON.parse(res.body);
    let items = [];

    for (let i = 0; i < rawData.tracks.items.length; i++) {

        const item = {
            name: rawData.tracks.items[i].name,
            artist: rawData.tracks.items[i].artists.map(x => x.name).join(", "),
            uri: rawData.tracks.items[i].uri,
        };

        items.push(item);
        global.uriCache[item.uri] = item;
    }

    return {
        query, items
    };
}

module.exports.tick = async () => {
    const nowPlaying = await getNowPlayingInfo();
    if (!nowPlaying) return null;

    // Track has changed
    const trackHasChanged = nowPlaying.uri !== global.nowPlaying.uri;
    if (trackHasChanged) {
        const next = nextTrackInQueue();

        if (next !== null && next.uri === nowPlaying.uri) {
            shiftQueue();
            onQueueChanged();
        }
    }

    global.nowPlaying = nowPlaying;

    return {
        trackHasChanged
    };
}

module.exports.addToQueue = async (uri, ownerID = null) => {
    // Has track been cached from a previous search?
    // NOTE: Cache gets pretty big, maybe clear it every now and then?
    const track = global.uriCache[uri];
    if (track === undefined) {
        console.error(`Tried to add uncached track to queue: ${uri}`);
        return false;
    }

    global.userQueue.push({
        ...track,
        ownerID,
        hearts: [],
        timestamp: Date.now(),
    });

    onQueueChanged();

    return true;
}

module.exports.heartTrack = (uri, clientID) => {
    const track = global.userQueue.find(track => track.uri === uri);

    if (track !== undefined) {
        if (track.hearts.indexOf(clientID) === -1) {
            track.hearts.push(clientID);
        } else {
            track.hearts = track.hearts.filter(id => id != clientID);
        }
    }
    onQueueChanged();
}

module.exports.removeTrack = (uri, clientID) => {
    const trackIndex = global.userQueue.findIndex(track => track.uri === uri);
    if (trackIndex === -1) return;

    const track = global.userQueue[trackIndex];

    if (track.ownerID === clientID) {
        global.userQueue.splice(trackIndex, 1);
    }

    onQueueChanged();
}

module.exports.nowPlaying = () => {
    return global.nowPlaying;
}

module.exports.queue = () => {
    return global.userQueue;
}

function onQueueChanged() {
    reorderQueue();
    updateRealtimePlaylistTrack();
    module.exports.onQueueChanged();
}

module.exports.onQueueChanged = () => {};