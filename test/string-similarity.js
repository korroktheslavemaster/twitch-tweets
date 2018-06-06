if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var ss = require("string-similarity");
// var tweets = require("./similar-tweets.json");
var tweets = require("./test-tweets.json");

var moment = require("moment");
var mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("../messagecount");

var tweet =
  "cmonBruh only real homie can build this perfect pyramid cmonBruh cmonBruh . Try like me !Try like me ! Try like me !! cmonBruh cmonBruh cmonBruh And my pyramid still higher!!!!!! cmonBruh cmonBruh cmonBruh cmonBruh";

// var matchString = "So you're going by";
(async () => {
  var tweeted = await MessageCount.find({
    tweeted: true
  }).exec();
  // console.log(tweeted);
  const { ratings, bestMatch } = ss.findBestMatch(
    tweet,
    tweeted.map(t => t.message)
  );
  console.log(ratings.sort((a, b) => -a.rating + b.rating).slice(1, 3));
  console.log(bestMatch);
  process.exit();
})();
