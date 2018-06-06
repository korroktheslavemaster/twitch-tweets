if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

var tweet = require("./twitter-bot");
var moment = require("moment");
var mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);
var MessageCount = require("./messagecount");

var sendTweet = async () => {
  console.log("Sending tweet!!!");
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
  try {
    var bestMessage = bestMessages[0];
    try {
      var response = await tweet(bestMessage.message);
      console.log(`tweeted: ${bestMessage.message}`);
    } catch (e) {
      console.log(`tried message: ${bestMessage.message}`);
      // give whole error, might get to know error code of twitter?
      console.log(`Could not tweet, error: ${JSON.stringify(e)}`);
      // just assume that we are done with this message, mark it as tweeted...
    }
    await MessageCount.findOneAndUpdate(
      { _id: bestMessage._id },
      { $set: { tweeted: true } }
    );
  } catch (e) {
    if (!bestMessages[0]) console.log("no best message??");
    else console.log(e);
  }

  return;
};

sendTweet()
  .then(x => process.exit())
  .catch(e => {
    console.log(e);
    process.exit();
  });
