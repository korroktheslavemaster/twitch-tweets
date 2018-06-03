var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserStateSchema = new Schema({
  badges: {
    broadcaster: {
      type: "Date"
    },
    warcraft: {
      type: "String"
    }
  },
  color: {
    type: "String"
  },
  "display-name": {
    type: "String"
  },
  emotes: {
    "25": {
      type: ["String"]
    }
  },
  mod: {
    type: "Boolean"
  },
  "room-id": {
    type: "String"
  },
  subscriber: {
    type: "Boolean"
  },
  turbo: {
    type: "Boolean"
  },
  "user-id": {
    type: "String"
  },
  "user-type": {
    type: "String"
  },
  "emotes-raw": {
    type: "String"
  },
  "badges-raw": {
    type: "String"
  },
  username: {
    type: "String"
  },
  "message-type": {
    type: "String"
  }
});
var schema = new Schema({
  channel: String,
  userstate: UserStateSchema,
  message: String,
  date: Date
});

var TwitchChatMessage = mongoose.model("TwitchChatMessage", schema);
module.exports = TwitchChatMessage;
