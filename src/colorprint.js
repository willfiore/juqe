const colors = require("colors");

module.exports.error = (str) => {
    console.error(str.red);
}

module.exports.success = (str) => {
    console.log(str.green);
}

module.exports.log = (str) => {
    console.log(str);
}

module.exports.info = (str) => {
    console.log(str.cyan);
}