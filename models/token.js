var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
  access_token: { type: String, required: true },
  refresh_token: String,
  token_type: String,
  expires_in: String,
  scope: String,
  expires_at: Date
});

var Token = mongoose.model("Token", schema);
module.exports = Token;
