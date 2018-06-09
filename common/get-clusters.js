if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
var moment = require("moment");
var fs = require("fs");

module.exports = async messages => {
  fs.writeFileSync(
    "/tmp/messagecount-recent.json",
    JSON.stringify(messages),
    "utf8"
  );
  require("child_process").execSync(
    "python ./common/get-cluster-tf.py /tmp/messagecount-recent.json /tmp/output.json > /dev/null"
  );
  var clusters = require("/tmp/output.json");
  return clusters;
};
