// Basic shape validation for user routes
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');

const validateUpdate = (req, res, next) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'At least one field (name, email) is required'));
  }

  next();
};

module.exports = {
  validateUpdate,
};
