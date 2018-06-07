if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var util = require("util");
var tweet = require("./twitter-bot");
var moment = require("moment");
var ss = require("string-similarity");
var mongoose = require("mongoose");
var assert = require("assert");
var DetectLanguage = require("detectlanguage");
var detectLanguage = new DetectLanguage({
  key: process.env.DETECT_LANGUAGE_API_KEY,
  ssl: true
});
const detect = util.promisify(detectLanguage.detect);

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("./messagecount");
var getClusters = require("./get-clusters");

const recoverableErrorCodes = [
  // twitter codes
  187 /* status is a duplicate */,
  186 /* tweet is too long */,
  // user codes
  1000 /* tweet too similar */,
  1001 /* tweet not english */
];

var markTweeted = async ({ _id } = {}) => {
  _id
    ? await MessageCount.findOneAndUpdate(
        { _id: _id },
        { $set: { tweeted: true } }
      ).exec()
    : "";
};

var markAllTweeted = async ids => {
  return await Promise.all(
    ids.map(_id =>
      MessageCount.findOneAndUpdate({ _id }, { $set: { tweeted: true } }).exec()
    )
  );
};

var assertCustom = (op, message, code) => {
  try {
    assert(op);
  } catch (e) {
    var error = new Error(message);
    error.code = code;
    throw error;
  }
};

// clustering:
var getBestMessages = async candidates => {
  // filter away 1 counts
  var filtered = candidates.filter(({ count }) => count > 1);
};

const getLanguage = async message => {
  var res = await detect(message);
  if (!res.length) return "";
  return res[0].language;
};

var sendTweet = async () => {
  console.log("Sending tweet!!!");
  var tweeted = await MessageCount.find({
    tweeted: true
  }).exec();
  var candidates = await MessageCount.find({
    tweeted: false,
    lastUpdated: {
      $gt: moment()
        .add(-30, "minutes")
        .toDate()
    }
  });
  if (candidates.length == 0) {
    console.log("nothing to tweet!");
    return;
  }
  console.log("getting clusters...");
  var clusteredMessages = getClusters(candidates);
  // var clusteredMessages = require("/tmp/output.json");

  console.log("trying clustesr...");
  for (var i = 0; i < clusteredMessages.length; i++) {
    try {
      const { canonicalMessage, ids, count } = clusteredMessages[i];
      // mark all as tweeted
      await markAllTweeted(ids);
      // check similarity to previous tweets
      const { ratings, bestMatch } = ss.findBestMatch(
        canonicalMessage,
        tweeted.map(t => t.message)
      );
      assertCustom(
        bestMatch.rating <= 0.7,
        `Too similar to: ${bestMatch.target}, similarity ${bestMatch.rating}`,
        1000
      );
      var language = await getLanguage(canonicalMessage);
      assertCustom(
        language == "en",
        `Not english: ${canonicalMessage}, is ${language}`,
        1001
      );

      var response = await tweet(canonicalMessage);
      console.log(`tweeted: ${canonicalMessage} with count ${count}`);
      break;
    } catch (e) {
      console.log(e);
      if (recoverableErrorCodes.indexOf(e.code) == -1) {
        // can't tweet anything else now
        break;
      }
    }
  }
  // while (true) {
  //   try {
  //     // send a tweet. should not be already tweeted and update not older than 30 minutes
  //     var bestMessages = await MessageCount.find({
  //       tweeted: false,
  //       lastUpdated: {
  //         $gt: moment()
  //           .add(-30, "minutes")
  //           .toDate()
  //       }
  //     })
  //       .sort({ count: -1 })
  //       .limit(1)
  //       .exec();
  //     var bestMessage = bestMessages[0];
  //     assert(bestMessage);
  //     // mark it as good as tweeted.
  //     await markTweeted(bestMessage);

  //     // check similarity to previous tweets
  //     const { ratings, bestMatch } = ss.findBestMatch(
  //       bestMessage.message,
  //       tweeted.map(t => t.message)
  //     );
  //     assertCustom(
  //       bestMatch.rating <= 0.7,
  //       `Too similar to: ${bestMatch.target}, similarity ${bestMatch.rating}`,
  //       1000
  //     );
  //     var language = await getLanguage(bestMessage.message);
  //     assertCustom(
  //       language == "en",
  //       `Not english: ${bestMessage.message}, is ${language}`,
  //       1001
  //     );

  //     var response = await tweet(bestMessage.message);
  //     console.log(`tweeted: ${bestMessage.message}`);
  //     break;
  //   } catch (e) {
  //     console.log(e);
  //     if (recoverableErrorCodes.indexOf(e.code) == -1) {
  //       // can't tweet anything else now
  //       break;
  //     }
  //   }
  // }
  return;
};

sendTweet()
  .then(x => process.exit())
  .catch(e => {
    console.log(e);
    process.exit();
  });
