module.exports = text => {
  reg = /https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)/gi;
  match = reg.exec(text);
  if (match && match.length > 2) return match[2];
  return null;
};
