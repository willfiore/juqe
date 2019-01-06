const express = require('express');
const app = express();

let auth_callback = (response) => {};

exports.setAuthCallback = function(func) {
    auth_callback = func;
}

exports.startListen = function(port = 80) {

    app.use("/auth", function (req, res, next) {
        if (req.path != "/") {
            next(); return;
        }

        auth_callback(req.query);
        next();

    }, express.static("auth/"));

    app.use("/", express.static("public/dist"));

    // On failure - no response
    app.use((req, res, next) => {
    });

    app.listen(port, () => console.log(`Listening on port ${port}`));
}