const express = require('express');
const app = express();

exports.startListen = function(port = 80) {
    app.use(express.static("www/dist"));
    app.listen(port, () => console.log(`Listening on port ${port}`));
}