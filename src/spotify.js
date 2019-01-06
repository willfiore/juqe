const request = require("request");
const opn = require("opn");
const querystring = require("querystring");
const crypto = require("crypto");

const CLIENT_ID = "52d5d1608065415cb5f6775c6720e1bf";
const CLIENT_SECRET = "ab1b3af243234d84b4f3bf6571febd04";

const REDIRECT_URI = "http://localhost/auth/";
let authenticated = false;

let auth_data = {};

// Refresh at this fraction of the expires_in value
const EXPIRY_MULTIPLIER = 0.8;

const user_authentication_state = crypto.randomBytes(16).toString("hex");

function refreshAccessToken(refresh_token) {
    request.post("https://accounts.spotify.com/api/token/", {
        form: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }
    }, (err, res, body) => {
        if (res.statusCode === 200) {
            auth_data = Object.assign(auth_data, JSON.parse(body));

            setTimeout(refreshAccessToken.bind(null, auth_data.refresh_token),
                EXPIRY_MULTIPLIER * auth_data.expires_in * 1000);
        }
    });
}

exports.openAuthenticationWindow = () => {
    let uri = "https://accounts.spotify.com/authorize/";
    uri += "?" + querystring.stringify({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        state: user_authentication_state,
        scope: "user-read-private streaming",
        //show_dialog: "true"
    });

    opn(uri);
}

exports.authenticate = (code, state, callback) => {
    if (state != user_authentication_state) {
        console.error("Received invalid state for authentication");
        return;
    }

    request.post("https://accounts.spotify.com/api/token/", {
        form: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
        }
    }, (err, res, body) => {
        if (res.statusCode === 200) {
            auth_data = JSON.parse(res.body);
            setTimeout(refreshAccessToken.bind(null, auth_data.refresh_token),
                EXPIRY_MULTIPLIER * auth_data.expires_in * 1000);

            console.log("Spotify authentication successful");
            callback();
        } else {
            console.log("Error authenticating:");
            console.log(res.body);
        }
    });
}

exports.search = (query, callback) => {
    request.get("https://api.spotify.com/v1/search/", {
        headers: {
            "Authorization": "Bearer " + auth_data.access_token
        },
        qs: {
            q: query + "*",
            type: "track",
            market: "from_token",
            limit: 20,
        }
    }, (err, res, body) => {

        if (res.statusCode !== 200) {
            console.log("error:", body);
            return;
        }

        let rawData = JSON.parse(body);
        let data = [];

        for (let i = 0; i < rawData.tracks.items.length; i++) {

            data.push({
                name: rawData.tracks.items[i].name,
                artist: rawData.tracks.items[i].artists.map(x => x.name).join(", "),
                uri: rawData.tracks.items[i].uri,
            });
        }

        callback(data);
    });
}