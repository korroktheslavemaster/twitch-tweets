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

var main = async () => {
  var res = await MessageCount.find({
    tweeted: false,
    lastUpdated: { $gt: new Date("2018-06-07T06:58:01.014Z") }
  });
  fs.writeFileSync(
    "/tmp/messagecount-recent.json",
    JSON.stringify(res),
    "utf8"
  );
  console.log("done");
  process.exit();
};

main();
