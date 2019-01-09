const crypto = require("crypto");
const opn = require("opn");
const querystring = require("querystring");
const request = require("./request-promise.js");
const utility = require("./utility.js");

const CLIENT_ID = "52d5d1608065415cb5f6775c6720e1bf";
const CLIENT_SECRET = "ab1b3af243234d84b4f3bf6571febd04";

const REDIRECT_URI = "http://localhost/auth/";
const REALTIME_PLAYLIST_NAME = "04bf6f70ee7683db";
let authenticated = false;

let authData = {};
let realtimePlaylistID = null;

let playQueue = [];
let contextQueue = [];

let exportCallbacks = {};

// Refresh at this fraction of the expires_in value
const EXPIRY_MULTIPLIER = 0.8;

const user_authentication_state = crypto.randomBytes(16).toString("hex");

function nextTrackInQueue() {
    if (playQueue.length !== 0) {
        return playQueue[0];
    }
    else if (contextQueue.length !== 0) {
        return contextQueue[0];
    }
    return null;
}

function shiftQueue() {
    if (playQueue.length !== 0) {
        playQueue.shift();
    }
    else if (contextQueue.length !== 0) {
        contextQueue.shift();
    }

    exportCallbacks["queue_changed"]();
}

async function refreshAccessToken(refresh_token) {
    let res = await request.post("https://accounts.spotify.com/api/token/", {
        form: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }
    });

    if (res.statusCode !== 200) {
        console.log("Error refreshing access token:", res.statusCode, res.body);
        return null;
    }

    authData = Object.assign(authData, JSON.parse(res.body));
}

async function authenticate(code, state) {

    if (state != user_authentication_state) {
        console.error("Received invalid state for authentication");
        return null;
    }

    let res = await request.post("https://accounts.spotify.com/api/token/", {
        form: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
        }
    });

    if (res.statusCode !== 200) {
        console.log("Error authenticating:", res.statusCode, res.body);
        return null;
    }

    authData = JSON.parse(res.body);
    console.log("Spotify authentication successful");

    setTimeout(function tick() {
        refreshAccessToken(authData.refresh_token);
        setTimeout(tick, EXPIRY_MULTIPLIER * authData.expires_in * 1000);
    }, EXPIRY_MULTIPLIER * authData.expires_in * 1000);

    return true;
}

async function loadContextPlaylist(id) {
    let res = await request.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
        headers: {
            "Authorization": "Bearer " + authData.access_token
        },
        qs: {
            fields: "items(track(name, uri, artists))"
        },
    });

    if (res.statusCode !== 200) {
        console.log("Error loading playlist:", res.statusCode, res.body);
        return false;
    }

    const playlistItems = JSON.parse(res.body).items;

    contextQueue = playlistItems.map(x => ({
        name: x.track.name,
        artist: x.track.artists.map(a => a.name).join(", "),
        uri: x.track.uri,
    }));

    utility.shuffleArray(contextQueue);

    return true;
}

async function getRealtimePlaylist() {

    let resGetPlaylists = await request.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
            "Authorization": "Bearer " + authData.access_token
        },
        qs: {
            limit: 50
        },
    });

    const success = resGetPlaylists.statusCode === 200;

    if (!success) {
        console.log("Error retrieving user playlists", resGetPlaylists.body);
        return null;
    }

    const playlistData = JSON.parse(resGetPlaylists.body);

    // Search for existing spotify playlist
    const playlist = playlistData.items.find(
        x => x.name === REALTIME_PLAYLIST_NAME);

    // Create it if it doesn't exist
    if (playlist === undefined) {
        const resCreatePlaylist = await request.post("https://api.spotify.com/v1/me/playlists", {
            headers: {
                "Authorization": "Bearer " + authData.access_token,
                "Content-Type": "application/json"
            },
            json: {
                name: REALTIME_PLAYLIST_NAME,
                public: false,
                //description: "Auto-generated realtime playlist for SPOTIBASH app"
            }
        });

        return resCreatePlaylist.body.id;
    } else {
        return playlist.id;
    }
}

async function getNowPlaying() {
    let res = await request.get("https://api.spotify.com/v1/me/player/currently-playing/", {
        headers: {
            "Authorization": "Bearer " + authData.access_token
        }
    });

    if (res.statusCode === 204) {
        console.log("Error getting now playing info: user is not using spotify?");
        return null;
    }
    else if (res.statusCode !== 200) {
        console.log("Error getting now playing info:", res.statusCode, res.body);
        return null;
    }

    const rawData = JSON.parse(res.body);

    if (rawData.item !== null) {
        let returnData = {}
        returnData.name = rawData.item.name;
        returnData.artist = rawData.item.artists.map(x => x.name).join(", ");
        returnData.duration_ms = rawData.item.duration_ms;
        returnData.progress_ms = rawData.progress_ms;
        returnData.album_art_uri = rawData.item.album.images[0].url;
        returnData.uri = rawData.item.uri;
        return returnData;
    }

    return null;
}

async function setRealtimePlaylistTracks(uris) {
    let res = await request.put(`https://api.spotify.com/v1/playlists/${realtimePlaylistID}/tracks`, {
        headers: {
            "Authorization": "Bearer " + authData.access_token,
        },
        qs: {
            uris: uris.join(",")
        }
    });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.log("Error setting realtime playlist song:", res.statusCode, res.body);
        return false;
    }

    return true;
}

// Unused due to Spotify API bug
async function playPlaylistContext(id) {
    let res = await request.put("https://api.spotify.com/v1/me/player/play", {
        headers: {
            "Authorization": "Bearer " + authData.access_token,
        },
        json: {
            context_uri: "spotify:playlist:" + id
        }
    });

    if (res.statusCode !== 204) {
        console.log("Failed to play playlist:", res.statusCode, res.body);
        return false;
    }
    return true;
}

exports.openAuthenticationWindow = () => {
    let uri = "https://accounts.spotify.com/authorize/";
    uri += "?" + querystring.stringify({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        state: user_authentication_state,
        scope: "user-modify-playback-state playlist-modify-private playlist-read-private user-read-playback-state user-read-private streaming",
        //show_dialog: "true",
    });

    opn(uri);
}

exports.init = async (code, state) => {

    // Authenticate
    let success = await authenticate(code, state);
    if (!success) {
        console.log("Failed authentication");
        return false;
    }

    // Load realtime and context playlists simultaneously
    let promiseRealtimePlaylist = getRealtimePlaylist();
    let promiseSuccessContextPlaylistLoad = loadContextPlaylist("06TyJVYonMbbYjKzfZ3XYh");
    realtimePlaylistID = await promiseRealtimePlaylist;
    if (realtimePlaylistID === null) return false;

    let successContextPlaylistLoad = await promiseSuccessContextPlaylistLoad;
    if (!successContextPlaylistLoad) return false;

    // Set songs in realtime playlist to first few
    let successRealtimePlaylistSong = await setRealtimePlaylistTracks([nextTrackInQueue().uri]);

    if (!successRealtimePlaylistSong) return false;

    // NOTE: For now, don't start the playlist automatically. Playback started
    // this way (through the Web API) does not correctly select the context in
    // the Spotify client, so future songs added to the playlist are not correctly
    // queued.
    // https://github.com/spotify/web-api/issues/537

    // let successPlay = await playPlaylistContext(realtimePlaylistID);
    // if (!successPlay) return false;

    // Just tell the user to start the playlist instead
    console.log(`Ready. Start the ${REALTIME_PLAYLIST_NAME} playlist in Spotify to begin.`);

    return true;
}

exports.search = async (query) => {
    let res = await request.get("https://api.spotify.com/v1/search/", {
        headers: {
            "Authorization": "Bearer " + authData.access_token
        },
        qs: {
            q: query + "*",
            type: "track",
            market: "from_token",
            limit: 20,
        }
    });

    if (res.statusCode !== 200) {
        console.log("Search error:", res.statusCode, res.body);
        return null;
    }

    let rawData = JSON.parse(res.body);
    let returnData = [];

    for (let i = 0; i < rawData.tracks.items.length; i++) {

        returnData.push({
            name: rawData.tracks.items[i].name,
            artist: rawData.tracks.items[i].artists.map(x => x.name).join(", "),
            uri: rawData.tracks.items[i].uri,
        });
    }

    return returnData;
}

exports.tick = async () => {
    let nowPlaying = await getNowPlaying();
    if (nowPlaying === null) return;

    // Update spotify realtime playlist when song changes
    if (nowPlaying.uri === nextTrackInQueue().uri) {
        shiftQueue();
        setRealtimePlaylistTracks([nextTrackInQueue().uri]);
    }

    return nowPlaying;
}

exports.addToQueue = async (uri) => {

    const id = uri.split(":").pop();

    // Get track data from uri
    const res = await request.get(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: {
            "Authorization": "Bearer " + authData.access_token
        },
        qs: {
            market: "GB"
        }
    });

    if (res.statusCode !== 200) {
        console.log("Failed to get track:", res.statusCode, res.body);
        return false;
    }

    const trackData = JSON.parse(res.body);

    playQueue.push({
        name: trackData.name,
        artist: trackData.artists.map(x => x.name).join(", "),
        uri: trackData.uri,
    });
    exportCallbacks["queue_changed"]();

    // Push queue to spotify
    setRealtimePlaylistTracks([nextTrackInQueue().uri]);

    return true;
}

exports.getQueue = function (limit = -1) {

    if (limit <= 0) {
        return playQueue.concat(contextQueue);
    } else {
        return playQueue.concat(contextQueue).slice(0, limit);
    }
}

exports.on = function(key, callback) {
    exportCallbacks[key] = callback;
}