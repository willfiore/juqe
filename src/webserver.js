const express = require("express");
const c = require("./colorprint");

module.exports = class WebServer {
    constructor(port = 80) {
        const expressApp = express();

        this.onAuth = (code, state) => {};

        expressApp.use("/auth", (req, res, next) => {
            if (req.path != "/") {
                next(); return;
            }

            // Sanity check authentication here
            if ("error" in req.query) {
                console.error("Authentication error: ", req.query.error);
                return;
            } 

            if ("code" in req.query && "state" in req.query) {
                this.onAuth(req.query.code, req.query.state);
            }
            next();

        }, express.static("auth/"));

        expressApp.use("/", express.static("public/dist"));

        // Failure - do not respond
        expressApp.use(() => {});

        // Begin listening
        expressApp.listen(port, () => c.info(`Web server listening on port ${port}`));
    }
}

// let auth_callback = (response) => {};
// 
// exports.setAuthCallback = function(func) {
//     auth_callback = func;
// }
// 
// exports.startListen = function(port = 80) {
// 
//     app.use("/auth", function (req, res, next) {
//         if (req.path != "/") {
//             next(); return;
//         }
// 
//         auth_callback(req.query);
//         next();
// 
//     }, express.static("auth/"));
// 
//     app.use("/", express.static("public/dist"));
// 
//     // On failure - no response
//     app.use((req, res, next) => {
//     });
// 
//     app.listen(port, () => console.log(`Listening on port ${port}`));
// }