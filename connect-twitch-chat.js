if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var tmi = require("tmi.js");
var mongoose = require("mongoose");
var request = require("request-promise");
var sha1 = require("sha1");
var tweet = require("./twitter-bot");
var moment = require("moment");

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
// twitch auth headers
var headers = {
  "Client-ID": "jrwaqxroacokn9bsgh6kjc6fl0pfwj"
};
var TwitchChatMessage = require("./twitchchatmessage");
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
  var botNames = ["Nightbot", "Moobot", "mordecaiibot", "OutbreakBot"];
  var blacklistedChannels = ["#uzra"];

  var sendTweetAndReset = async () => {
    console.log("Sending tweet!!!");
    // send a tweet. should not be already tweeted and update not older than 30 minutes
    var bestMessages = await MessageCount.find({
      tweeted: false,
      lastUpdated: {
        $gt: moment()
          .add(-30, "minutes")
          .toDate()
      }
    })
      .sort({ count: -1 })
      .limit(1)
      .exec();
    var bestMessage = bestMessages[0];
    try {
      var response = await tweet(bestMessage.message);
      console.log(`tweeted: ${bestMessage.message}`);
    } catch (e) {
      console.log(`tried message: ${bestMessage.message}`);
      console.log(`Could not tweet, error: ${e.message}`);
      // just assume that we are done with this message, mark it as tweeted...
    }
    await MessageCount.findOneAndUpdate(
      { _id: bestMessage._id },
      { $set: { tweeted: true } }
    );
    // fetch top channels and connect to them
    if (client.readyState() == "OPEN") {
      await client.disconnect();
      const { channel_names, cursor } = await getChannelNames();
      client.channels = channel_names.map(n => `#${n}`);
      await client.connect();
    }
    return;
  };
  // call once
  await sendTweetAndReset();
  setInterval(sendTweetAndReset, 1000 * 60 * 10);

  client.on("message", async function(channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
    // await new TwitchChatMessage({
    //   date: new Date(),
    //   userstate,
    //   message,
    //   channel
    // }).save();
    // Handle different message types..
    switch (userstate["message-type"]) {
      case "action":
        // This is an action message..
        break;
      case "chat":
        var username = userstate["display-name"];
        if (
          countWords(message) > 13 &&
          botNames.indexOf(username) <= -1 &&
          // use substring search for bot
          username.toLowerCase().indexOf("bot") <= -1 &&
          blacklistedChannels.indexOf(channel) <= -1
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
