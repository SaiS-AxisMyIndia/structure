// Basic shape validation for auth routes (required, email, number, etc.)
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'name, email and password are required'));
  }

  if (!isEmail(email)) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid email format'));
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'email and password are required'));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
