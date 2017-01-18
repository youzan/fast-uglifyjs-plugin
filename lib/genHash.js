var crypto = require('crypto');

function genHash(content) {
  const hash = crypto
                .createHash('sha1')
                .update(content)
                .digest('hex');

  return hash;
}

module.exports = genHash;