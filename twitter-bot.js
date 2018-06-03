var Twit = require("twit");

// Pulling all my twitter account info from another file
var config = require("./twitter-config.js");
// Making a Twit object for connection to the API
var T = new Twit(config);

module.exports = async tweet => {
  var response = await T.post("statuses/update", { status: tweet });
  // console.log(response);
  return response;
};
