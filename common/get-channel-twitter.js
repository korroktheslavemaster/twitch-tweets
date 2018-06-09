if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var request = require("request-promise");
var url = require("url");
var twitterRegex = require("./twitter-regex");

// twitch auth headers
var headers = {
  "Client-ID": process.env.TWITCH_CLIENT_ID
};

module.exports = async channelName => {
  // remove the '#' at the beginning
  channelName = channelName.substring(1);
  try {
    var res = await request({
      url: `https://api.twitch.tv/api/channels/${channelName}/panels?client_id=${process
        .env.TWITCH_CLIENT_ID}`,
      headers
    });
    var panels = JSON.parse(res);
    // console.log(panels);
  } catch (e) {
    console.log(e.message);
    return null;
  }
  // get from panel data. actually why bother with this? why not just regex?
  var twitterUrl = panels
    .map(({ data: { link } }) => link)
    .filter(link => link)
    .find(link => /twitter\.com\//.test(link));
  if (twitterUrl) {
    return url.parse(twitterUrl, true).pathname.substring(1);
  }
  // try to get by parsing raw string
  return twitterRegex(res);
};
