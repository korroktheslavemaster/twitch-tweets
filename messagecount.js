var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
  _id: String,
  message: String,
  channel: String,
  username: String,
  count: { type: Number, default: 1 },
  tweeted: { type: Boolean, default: false },
  lastUpdated: Date
});

var MessageCount = mongoose.model("MessageCount", schema);
module.exports = MessageCount;
