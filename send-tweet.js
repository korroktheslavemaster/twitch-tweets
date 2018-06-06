if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var tweet = require("./twitter-bot");
var moment = require("moment");
var ss = require("string-similarity");
var mongoose = require("mongoose");
var assert = require("assert");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("./messagecount");

const recoverableErrorCodes = [
  // twitter codes
  187 /* status is a duplicate */,
  186 /* tweet is too long */,
  // user codes
  1000 /* tweet too similar */
];

var markTweeted = async ({ _id } = {}) => {
  _id
    ? await MessageCount.findOneAndUpdate(
        { _id: _id },
        { $set: { tweeted: true } }
      ).exec()
    : "";
};

var sendTweet = async () => {
  console.log("Sending tweet!!!");
  var tweeted = await MessageCount.find({
    tweeted: true
  }).exec();
  while (true) {
    try {
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
      assert(bestMessage);
      // mark it as good as tweeted.
      await markTweeted(bestMessage);
      const { ratings, bestMatch } = ss.findBestMatch(
        bestMessage.message,
        tweeted.map(t => t.message)
      );
      if (bestMatch.rating > 0.7) {
        var error = new Error(
          `Too similar to: ${bestMatch.target}, similarity ${bestMatch.rating}`
        );
        error.code = 1000;
        throw error;
      }
      var response = await tweet(bestMessage.message);
      console.log(`tweeted: ${bestMessage.message}`);
      break;
    } catch (e) {
      console.log(e);
      if (recoverableErrorCodes.indexOf(e.code) == -1) {
        // can't tweet anything else now
        break;
      }
    }
  }
  return;
};

sendTweet()
  .then(x => process.exit())
  .catch(e => {
    console.log(e);
    process.exit();
  });
