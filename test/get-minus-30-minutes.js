var moment = require("moment");
console.log(
  moment()
    .add(-30, "minutes")
    .toISOString()
);
