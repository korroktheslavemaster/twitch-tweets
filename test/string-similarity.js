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
  "扛下去扛下去 欸 GivePLZ GivePLZ 扛下去扛下去 欸 TakeNRG TakeNRG 搖勒搖勒搖 阮是廟口男子漢 BloodTrail BloodTrail 咚猜 我在咚咚猜 GivePLZ GivePLZ 我帶你來鑽轎腳 TakeNRG TakeNRG GivePLZ GivePLZ 保恁身體健康 萬事平安 TakeNRG TakeNRG 發發發發發2";

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
