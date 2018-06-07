if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const util = require("util");

var DetectLanguage = require("detectlanguage");
var detectLanguage = new DetectLanguage({
  key: process.env.DETECT_LANGUAGE_API_KEY,
  ssl: true
});

const detect = util.promisify(detectLanguage.detect);
var dataSimple =
  "ˢʷᵉᵃʳ ᵗᵒ ᵍᵒᵈ ᶦᶠ ᵃᶰʸ ᵒᶠ ʸᵒᵘ ᵐᵒᵗʰᵉʳʳᶠᵘᶜᵏᵉʳˢ ᶜᵒᵖʸ ᵃᶰᵈ ᵖᵃˢᵗᵉ ᵗʰᶦˢ ʸᵒᵘ ʷᶦᶫᶫ ᵇᵉ ᶦᶰ ˢᵉʳᶦᵒᵘˢ ᵗʳᵒᵘᵇᶫᵉ";
// detectLanguage.detect(dataSimple, function(error, result) {
// console.log(JSON.stringify(result));
// });
detect(dataSimple).then(x => console.log(x));
