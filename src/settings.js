const fs = require("fs");
const TOML = require("@iarna/toml");
const util = require("util");

module.exports.settings = {
    // Filled with defaults
    spotify: {
        clientID: "",
        clientSecret: "",
    },
    network: {
        webPort: 80,
        webSocketPort: 8080,
    },
};

module.exports.loadFromFile = () => {
    const string = fs.readFileSync("settings.toml");
    module.exports.settings = TOML.parse(string);
}

module.exports.saveToFile = () => {
    fs.writeFileSync("settings.toml", TOML.stringify(module.exports.settings));
}

module.exports.fileExists = () => {
    return fs.existsSync("settings.toml");
}