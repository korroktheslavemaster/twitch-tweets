var Twit = require("twit");

// Pulling all my twitter account info from another file
var config = require("../twitter-config.js");
// Making a Twit object for connection to the API
var T = new Twit(config);

var tweet = async status => {
  var response = await T.post("statuses/update", { status });
  // console.log(response);
  return response;
};
const maxTweetLength = 280;
const partialTweetLength = 260;
// split tweet if longer than 280
module.exports = async status => {
  if (status.length <= maxTweetLength) return await tweet(status);
  var numTweets = Math.ceil(status.length / partialTweetLength);
  for (var i = 0; i < numTweets; i++) {
    var partialStatus = status.substring(
      i * partialTweetLength,
      (i + 1) * partialTweetLength
    );
    await tweet(
      `(${i + 1}/${numTweets}) ${i == 0 ? "" : "..."}${partialStatus}${i ==
      numTweets - 1
        ? ""
        : "..."}`
    );
  }
  // console.log(response);
  return {};
};
