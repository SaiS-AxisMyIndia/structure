// Basic shape validation for payment routes
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const validateCreate = (req, res, next) => {
  const { amount, currency } = req.body;

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'amount must be a positive number'));
  }

  if (currency && typeof currency !== 'string') {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'currency must be a string'));
  }

  next();
};

module.exports = {
  validateCreate,
};
