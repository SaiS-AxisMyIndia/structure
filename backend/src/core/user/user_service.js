// Business logic for user, calls repo
const ApiError = require('../../config/utils/apiError');
const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const userRepo = require('./user_repo');

const getAll = async () => userRepo.findAll();

const getById = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, messages.USER.NOT_FOUND);
  }
  return user;
};

const update = async (id, data) => {
  const user = await userRepo.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, messages.USER.NOT_FOUND);
  }
  return userRepo.updateById(id, data);
};

const remove = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, messages.USER.NOT_FOUND);
  }
  return userRepo.deleteById(id);
};

module.exports = {
  getAll,
  getById,
  update,
  remove,
};
