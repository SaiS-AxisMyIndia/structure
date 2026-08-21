// Method declaration, basic validation, encrypt/decrypt, token — as needed per route
const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const ApiResponse = require('../../config/utils/apiResponse');
const asyncHandler = require('../../config/utils/asyncHandler');
const Session = require('../../config/security/session');
const authService = require('./auth_service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return new ApiResponse(httpStatus.CREATED, messages.AUTH.REGISTER_SUCCESS, result).send(res);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return new ApiResponse(httpStatus.OK, messages.AUTH.LOGIN_SUCCESS, result).send(res);
});

const refreshToken = asyncHandler(async (req, res) => {
  const tokens = Session.refresh(req.body.refreshToken);
  return new ApiResponse(httpStatus.OK, 'Token refreshed', tokens).send(res);
});

const logout = asyncHandler(async (req, res) => {
  Session.logout();
  return new ApiResponse(httpStatus.OK, messages.AUTH.LOGOUT_SUCCESS, {}).send(res);
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
