if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("../messagecount");
var moment = require("moment");
var fs = require("fs");
var ss = require("string-similarity");
var _ = require("lodash");

var messages = require("/tmp/messagecount-recent.json");

messages = messages.sort((a, b) => -a.count + b.count);

var main = async () => {
  // filter 1 counts. actually don't, they are useful eg. r9k mode
  // used up elements
  var done = new Array(messages.length).map(x => false);
  var groupings = {};
  for (const [idx, message] of messages.entries()) {
    if (done[idx]) continue;
    done[idx] = true;
    var id = message._id;
    groupings[id] = {
      messages: [message.message],
      count: message.count
    };
    messages.forEach((val, idx2) => {
      if (done[idx2]) return;
      if (ss.compareTwoStrings(message.message, val.message) > 0.9) {
        // same
        groupings[id].count += val.count;
        groupings[id].messages.push(val.message);
        done[idx2] = true;
      }
    });
  }
  console.log(groupings);
};

main();
