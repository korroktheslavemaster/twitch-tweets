if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var tmi = require("tmi.js");
var mongoose = require("mongoose");
var request = require("request-promise");
var sha1 = require("sha1");
var moment = require("moment");
var entropy = require("../common/entropy-calc");
var franc = require("franc");
const {
  botNames,
  blacklistedChannels,
  blacklistedLanguages,
  allowedLanguages
} = require("../common/constants");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
// twitch auth headers
var headers = {
  "Client-ID": process.env.TWITCH_CLIENT_ID
};
var MessageCount = require("../models/messagecount");

// only get english language streams!
var getChannelNames = async cursor => {
  var channels = await request({
    url: `https://api.twitch.tv/helix/streams?first=100${cursor
      ? `&after=${cursor}&language=en`
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

// google translate to get language. hopefully not too expensive...
var gcpGetLanguage = async message => {
  var res = await request({
    method: "POST",
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${process
      .env.GOOGLE_TRANSLATE_API_KEY}`,
    body: {
      q: [message]
    },
    json: true
  });
  const { language } = res.data.detections[0][0];
  return language;
};

var run = async () => {
  const { channel_names, cursor } = await getChannelNames();
  var client = new tmi.client({
    connection: {
      reconnect: true
    },
    options: {
      clientId: process.env.TWITCH_CLIENT_ID
    },
    identity: {
      username: process.env.TWITCH_CLIENT_USERNAME,
      password: process.env.TWITCH_CLIENT_OAUTH
    },
    channels: channel_names.map(n => `#${n}`)
  });

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
          // no bots
          botNames.indexOf(username) <= -1 &&
          // use substring search for bot
          username.toLowerCase().indexOf("bot") <= -1 &&
          blacklistedChannels.indexOf(channel) <= -1 &&
          // hardcoded limit for entropy > 2.1; run test/entropy.js to figure out a good value
          entropy(message) > 2.1 &&
          // shouldn't be a mod. that way bot messages can be filtered better hopefully
          !userstate.mod &&
          // shouldn't be the broadcaster themselves
          username.toLowerCase() != channel.slice(1) &&
          // also should be english
          allowedLanguages.indexOf(franc(message)) != -1
          // use gcp
          // no too expensive...
          // (await gcpGetLanguage(message)) != "en"
        ) {
          console.log(`(${franc(message)})(${channel})${username}: ${message}`);
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

// after 30 minutes kill yourself
setTimeout(process.exit, 1000 * 60 * 30);
