// Business logic for auth, calls repo
const ApiError = require('../../config/utils/apiError');
const httpStatus = require('../../config/constants/httpStatus');
const messages = require('../../config/constants/messages');
const { hash, compare } = require('../../config/security/encryption');
const Session = require('../../config/security/session');
const authRepo = require('./auth_repo');

const register = async ({ name, email, password }) => {
  const existingUser = await authRepo.findByEmail(email);
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already in use');
  }

  const hashedPassword = await hash(password);
  const user = await authRepo.createUser({ name, email, password: hashedPassword });

  const { accessToken, refreshToken } = Session.generate(user.id, user.role);

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.INVALID_CREDENTIALS);
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = Session.generate(user.id, user.role);

  return { user, accessToken, refreshToken };
};

module.exports = {
  register,
  login,
};
