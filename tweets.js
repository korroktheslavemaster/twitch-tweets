var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
  message: String,
  channel: String,
  date: Date,
  count: Number,
  messagecount_id: { type: String, ref: "MessageCount" }
});

var Tweet = mongoose.model("Tweet", schema);
module.exports = Tweet;
