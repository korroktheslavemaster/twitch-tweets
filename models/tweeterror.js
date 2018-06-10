var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
  message: String,
  code: String,
  stack: String,
  date: Date
});

var TweetError = mongoose.model("TweetError", schema);
module.exports = TweetError;
