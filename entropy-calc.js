module.exports = sentence => {
  var words = sentence.trim().split(/\s+/);
  var dict = {};
  for (word of words) {
    if (dict[word]) dict[word] += 1;
    else dict[word] = 1;
  }
  var entropy = 0;
  Object.keys(dict).forEach(key => {
    var prob = dict[key] / words.length;
    entropy += -prob * Math.log2(prob);
  });
  return entropy;
};
