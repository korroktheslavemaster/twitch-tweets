if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
var request = require("request-promise");
var mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/test-twitch-app"
);

const Token = require("./token");

// Set the configuration settings
const credentials = {
  client: {
    id: process.env.TWITCH_CLIENT_ID,
    secret: process.env.TWITCH_CLIENT_SECRET
  },
  auth: {
    tokenHost: "https://id.twitch.tv",
    authorizePath: "/oauth2/authorize",
    tokenPath: "/oauth2/token"
  }
};

var oauth2orize = require("oauth2orize");
// Initialize the OAuth2 Library
var server = oauth2orize.createServer();

server.grant(
  oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var code = utils.uid(16);

    var ac = new AuthorizationCode(
      code,
      client.id,
      redirectURI,
      user.id,
      ares.scope
    );
    ac.save(function(err) {
      if (err) {
        return done(err);
      }
      return done(null, code);
    });
  })
);

app.get("/", (req, res) =>
  res.send("Hello World!</br><a href='/auth'>Login with Twitch</a>")
);

app.get("/auth", (req, res) => {
  var authorizationUrl = oauth2.authorizationCode.authorizeURL({
    // force_verify: true,
    redirect_uri: process.env.AUTHORIZE_CALLBACK,
    scope: ["user:edit user:read:email"],
    state: "3(#0/!~",
    duration: "permanent"
  });
  console.log(authorizationUrl);
  res.redirect(authorizationUrl);
});

app.get("/authorize_callback", async (req, res) => {
  const { scope, code } = req.query;
  const options = {
    code,
    redirect_uri: process.env.AUTHORIZE_CALLBACK,
    grant_type: "authorization_code"
  };
  try {
    const result = await oauth2.authorizationCode.getToken(options);

    console.log("The resulting token: ", result);

    const token = oauth2.accessToken.create(result);
    await new Token(token.token).save();
    return res.redirect("/success");
  } catch (error) {
    console.error("Access Token Error", error.message);
    return res.status(500).json("Authentication failed");
  }
});

app.get("/success", (req, res) => res.send("Success!"));

var port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
