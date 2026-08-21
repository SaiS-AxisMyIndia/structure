// DB queries + DB-level validation for auth
const { User } = require('../../config/entities');

const findByEmail = async (email) => {
  // return User.findOne({ email });
  return null;
};

const createUser = async (userData) => {
  // return User.create(userData);
  return { id: 'stub-id', ...userData };
};

module.exports = {
  findByEmail,
  createUser,
};
