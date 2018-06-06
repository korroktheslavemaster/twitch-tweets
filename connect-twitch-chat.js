if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var tmi = require("tmi.js");
var mongoose = require("mongoose");
var request = require("request-promise");
var sha1 = require("sha1");
var moment = require("moment");
var entropy = require("./entropy-calc");

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
// twitch auth headers
var headers = {
  "Client-ID": "jrwaqxroacokn9bsgh6kjc6fl0pfwj"
};
var MessageCount = require("./messagecount");

var getChannelNames = async cursor => {
  var channels = await request({
    url: `https://api.twitch.tv/helix/streams?first=100${cursor
      ? `&after=${cursor}`
      : ""}`,
    headers
  });
  channels = JSON.parse(channels);
  var user_ids = channels.data.map(({ user_id }) => user_id);
  var user_url = `https://api.twitch.tv/helix/users?${user_ids
    .map(user_id => `id=${user_id}&`)
    .join("")}`;
  var users = await request({ url: user_url, headers });
  var users = JSON.parse(users);
  return {
    channel_names: users.data.map(e => e.login),
    cursor: channels.pagination.cursor
  };
};

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

var run = async () => {
  const { channel_names, cursor } = await getChannelNames();
  var client = new tmi.client({
    options: {
      clientId: "jrwaqxroacokn9bsgh6kjc6fl0pfwj"
    },
    identity: {
      username: "kektobiologist",
      password: "oauth:oebqlz0d1ednv8d6ison38jj07mj0h"
    },
    channels: channel_names.map(n => `#${n}`)
  });
  var botNames = [
    "Nightbot",
    "Moobot",
    "mordecaiibot",
    "OutbreakBot",
    "StreamElements"
  ];
  var blacklistedChannels = ["#uzra"];

  client.on("message", async function(channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
    // Handle different message types..
    switch (userstate["message-type"]) {
      case "action":
        // This is an action message..
        break;
      case "chat":
        var username = userstate["display-name"];
        message = message.trim();
        if (
          countWords(message) > 13 &&
          botNames.indexOf(username) <= -1 &&
          // use substring search for bot
          username.toLowerCase().indexOf("bot") <= -1 &&
          blacklistedChannels.indexOf(channel) <= -1 &&
          // hardcoded limit for entropy > 2.5; run test-entropy.js to figure out a good value
          entropy(message) > 2.5 &&
          // shouldn't be a mod. that way bot messages can be filtered better hopefully
          !userstate.mod
        ) {
          console.log(`(${channel})${username}: ${message}`);
          var hash = sha1(message);
          var ret = await MessageCount.findByIdAndUpdate(
            hash,
            {
              $inc: { count: 1 },
              $set: {
                _id: hash,
                message,
                channel,
                username,
                lastUpdated: new Date()
              }
            },
            {
              upsert: true,
              setDefaultsOnInsert: true
            }
          ).exec();
        }
        // console.log(userstate);
        // This is a chat message..
        break;
      case "whisper":
        // This is a whisper..
        break;
      default:
        // Something else ?
        break;
    }
    return;
  });
  client.connect();
};

// Connect the client to the server..
run();

// after 10 minutes kill yourself
setTimeout(process.exit, 1000 * 60 * 10);
