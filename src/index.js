const spotify = require("./spotify.js");
const webserver = require("./webserver.js");
const websocketserver = require("./websocketserver.js");

// Webserver init
webserver.setAuthCallback((res) => {
    if ("error" in res) {
        console.log("Authentication error:", res.error);
    }

    if ("code" in res && "state" in res) {
        spotify.authenticate(res.code, res.state, ()=> {
        });
    }
});
webserver.startListen();

spotify.openAuthenticationWindow();