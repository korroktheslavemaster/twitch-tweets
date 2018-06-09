var entropy = require("../common/entropy-calc");
var tweets = require("./test-tweets.json");

var res = tweets.map(t => ({
  t,
  entropy: entropy(t)
}));

console.log(res);
