if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var getChannelTwitter = require("../common/get-channel-twitter");

// (async channelName => {
//   var res = await request({
//     url: `https://api.twitch.tv/api/channels/${channelName}/panels?client_id=${process
//       .env.TWITCH_CLIENT_ID}`,
//     headers
//   });
//   console.log(JSON.parse(res).map(elm => elm.data.link));
// })("pgl_dota2");
(async () => {
  console.log(await getChannelTwitter(process.argv[2] || "#pgl_dota2"));
})();
