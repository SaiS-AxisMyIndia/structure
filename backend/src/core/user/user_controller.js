const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const ApiResponse = require('../../config/utils/apiResponse');
const asyncHandler = require('../../config/utils/asyncHandler');
const userService = require('./user_service');

const getAll = asyncHandler(async (req, res) => {
  const users = await userService.getAll();
  return new ApiResponse(httpStatus.OK, 'Users fetched successfully', users).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  return new ApiResponse(httpStatus.OK, 'User fetched successfully', user).send(res);
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  return new ApiResponse(httpStatus.OK, messages.USER.UPDATED, user).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id);
  return new ApiResponse(httpStatus.OK, messages.USER.DELETED, null).send(res);
});

module.exports = {
  getAll,
  getById,
  update,
  remove,
};
