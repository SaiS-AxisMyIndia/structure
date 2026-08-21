// DB queries + DB-level validation for user
const { User } = require('../../config/entities');

const findAll = async () => {
  // return User.find();
  return [];
};

const findById = async (id) => {
  // return User.findById(id);
  return null;
};

const updateById = async (id, data) => {
  // return User.findByIdAndUpdate(id, data, { new: true });
  return { id, ...data };
};

const deleteById = async (id) => {
  // return User.findByIdAndDelete(id);
  return { id };
};

module.exports = {
  findAll,
  findById,
  updateById,
  deleteById,
};
