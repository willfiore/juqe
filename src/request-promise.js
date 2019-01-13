const request = require("request");
const util = require("util");

module.exports = util.promisify(request);