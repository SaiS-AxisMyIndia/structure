// Wraps the encryption/hashing package (e.g. bcrypt)
const bcrypt = require('bcryptjs');

const hash = async (plainText, saltRounds = 10) => bcrypt.hash(plainText, saltRounds);

const compare = async (plainText, hashed) => bcrypt.compare(plainText, hashed);

module.exports = {
  hash,
  compare,
};
