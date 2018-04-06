if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Hello World!"));
var port = process.env.PORT;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
