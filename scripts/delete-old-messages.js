if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var moment = require("moment");
var mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("../models/messagecount");

// delete all message that are older than one hour and not tweeted
(async () => {
  await MessageCount.deleteMany({
    tweeted: false,
    lastUpdated: {
      $lt: moment()
        .add(-12, "hours")
        .toDate()
    }
  });
  process.exit();
})();
