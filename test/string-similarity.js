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
  "愛的魔力轉圈圈 TakeNRG MVGame 愛的魔力好尖尖 MVGame MorphinTime 愛的魔力轉Chin Chin MorphinTime KappaPride 廚爹的那隻感覺 KappaPride TTours 側錄的那種感覺 有點點危險 TTours 聊天室通通他媽轉起來等等我一個一個檢查";

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
