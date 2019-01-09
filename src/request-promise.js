const request = require("request");
const util = require("util");

exports.get = util.promisify(request.get);
exports.post = util.promisify(request.post);
exports.put = util.promisify(request.put);