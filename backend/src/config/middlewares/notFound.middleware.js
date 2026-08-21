const httpStatus = require('../constants/httpStatus');

const notFoundMiddleware = (req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
  });
};

module.exports = notFoundMiddleware;
