var tr = require("../common/twitter-regex");

var testString =
  "[Twitter - @PurgeGamers](http://twitter.com/tweets_twitch https://www.twitter.com/PurgeGamers \n\n\n[YouTube - PurgeGamers](http://www.youtube.com/PurgeGamers)\n\n\n[Facebook - PurgeGamers](http://www.facebook.com/PurgeGamers)\n\n\n[PurgeGamers.com](https://purgegamers.true.io/)";
console.log(tr(testString));
