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
  "VoHiYo only real WEEB can build this perfect pyramid VoHiYo VoHiYo . Try like me !Try like me ! Try like me !! VoHiYo VoHiYo VoHiYo And my pyramid still higher!!!!!! VoHiYo VoHiYo VoHiYo VoHiYo";

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
