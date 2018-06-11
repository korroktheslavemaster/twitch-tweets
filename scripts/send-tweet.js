if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var util = require("util");
var tweet = require("../common/twitter-bot");
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
var MessageCount = require("../models/messagecount");
var Tweet = require("../models/tweet");
var TweetError = require("../models/tweeterror");
var getClusters = require("../common/get-clusters");
var getChannelTwitter = require("../common/get-channel-twitter");

const recoverableErrorCodes = [
  // twitter codes
  187 /* status is a duplicate */,
  186 /* tweet is too long */,
  // user codes
  1000 /* tweet too similar */,
  1001 /* tweet not english */,
  1002 /* has spammy @mentions, twitter doesn't like that */
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

const getLanguage = async message => {
  var res = await detect(message);
  if (!res.length) return "";
  return res[0].language;
};

var numSpammyMentions = message => {
  var regex = /@([a-zA-z0-9_]*)/g;
  count = 0;
  while (regex.exec(message) != null) {
    count += 1;
  }
  return count;
};

var sendTweet = async () => {
  console.log("Sending tweet!!!");
  // only compare to tweets in the last 2 days
  var tweeted = await MessageCount.find({
    tweeted: true,
    lastUpdated: {
      $gt: moment()
        .add(-2, "days")
        .toDate()
    }
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
  console.log(`got ${candidates.length} candidates. getting clusters...`);
  var clusteredMessages = await getClusters(candidates);
  // var clusteredMessages = require("/tmp/output.json");
  if (clusteredMessages.length == 0) {
    console.log("Found 0 clusters???");
    return;
  }
  console.log(clusteredMessages[0]);
  console.log("trying clustesr...");
  for (var i = 0; i < clusteredMessages.length; i++) {
    console.log(`iter ${i}`);
    try {
      const {
        canonicalMessage: message,
        canonicalId: messagecount_id,
        ids,
        count,
        channel
      } = clusteredMessages[i];
      // mark all as tweeted
      await markAllTweeted(ids);

      // check if it has spammy @s
      assertCustom(
        numSpammyMentions(message) < 2,
        `Too spammy, has lots of mentions: '${message}'`,
        1002
      );
      // check similarity to previous tweets
      const { ratings, bestMatch } = ss.findBestMatch(
        message,
        tweeted.map(t => t.message)
      );
      assertCustom(
        bestMatch.rating <= 0.7,
        `Too similar to: '${bestMatch.target}', similarity ${bestMatch.rating}`,
        1000
      );
      // check language
      var language = await getLanguage(message);
      assertCustom(
        language == "en",
        `Not english: '${message}', is ${language}`,
        1001
      );
      // check if twitter handle can be added
      // also mention with a probability of 30%
      var tweetMessage = message;
      var hasMention = false;
      // don't bother with mentions
      // var twitterHandle = await getChannelTwitter(channel);
      // if (twitterHandle && Math.random() < 0.3) {
      //   // check if tweets in last 48 hours had mention
      //   var mentionedTweets = await Tweet.find({
      //     channel,
      //     hasMention: true,
      //     date: { $gt: moment().add(-48, "hours") }
      //   }).exec();
      //   // probably should also add a filter for min count?
      //   if (!mentionedTweets.length) {
      //     tweetMessage = `- @${twitterHandle} ${tweetMessage}`;
      //     hasMention = true;
      //   }
      // }

      // add hashtag with channel name
      tweetMessage = `- ${channel} ${tweetMessage}`;

      var response = await tweet(tweetMessage);
      // write this to the actually tweeted collection
      await new Tweet({
        message: tweetMessage,
        channel,
        date: new Date(),
        count,
        messagecount_id,
        hasMention
      }).save();

      console.log(`tweeted: '${tweetMessage}' with count ${count}`);
      break;
    } catch (e) {
      console.log(e.message);
      await new TweetError({
        message: e.message,
        stack: e.stack,
        code: e.code.toString(),
        date: new Date()
      }).save();
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
