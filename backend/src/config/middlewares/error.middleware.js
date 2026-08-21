const httpStatus = require('../constants/httpStatus');
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  logger.error(`${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
