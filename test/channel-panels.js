if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var request = require("request-promise");

// twitch auth headers
var headers = {
  "Client-ID": process.env.TWITCH_CLIENT_ID
};

(async channelName => {
  var res = await request({
    url: `https://api.twitch.tv/api/channels/${channelName}/panels?client_id=${process
      .env.TWITCH_CLIENT_ID}`,
    headers
  });
  console.log(JSON.parse(res).map(elm => elm.data.link));
})("pgl_dota2");
