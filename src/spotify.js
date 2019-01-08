const request = require("./request-promise.js");
const opn = require("opn");
const querystring = require("querystring");
const crypto = require("crypto");

const CLIENT_ID = "52d5d1608065415cb5f6775c6720e1bf";
const CLIENT_SECRET = "ab1b3af243234d84b4f3bf6571febd04";

const REDIRECT_URI = "http://localhost/auth/";
const REALTIME_PLAYLIST_NAME = "spotibash-realtime";
let authenticated = false;

let authData = {};
let realtimePlaylist = null;

// Refresh at this fraction of the expires_in value
const EXPIRY_MULTIPLIER = 0.8;

const user_authentication_state = crypto.randomBytes(16).toString("hex");

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

exports.openAuthenticationWindow = () => {
    let uri = "https://accounts.spotify.com/authorize/";
    uri += "?" + querystring.stringify({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        state: user_authentication_state,
        scope: "playlist-modify-private playlist-read-private user-read-playback-state user-read-private streaming",
        //show_dialog: "true",
    });

    opn(uri);
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
                description: "Auto-generated realtime playlist for SPOTIBASH app"
            }
        });

        return resCreatePlaylist.body.uri;
    } else {
        return playlist.uri;
    }
}

exports.init = async (code, state) => {
    // NEED CALLBACK HERE

    let success = await authenticate(code, state);

    if (!success) {
        console.log("Failed authentication");
        return false;
    }

    let playlist = await getRealtimePlaylist();

    if (playlist === null) {
        console.log("Failed to get realtime playlist");
        return false;
    }

    realtimePlaylist = playlist;

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

exports.nowPlaying = async () => {
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
        return returnData;
    }

    return null;
}