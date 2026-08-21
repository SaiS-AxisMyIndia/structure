// Binds Session for the lifetime of the request based on the Authorization header.
// requireSession -> route needs a valid token, 401s otherwise.
// attachSession  -> route works with or without a token; use Session.tryId()/tryRole().
const jwt = require('jsonwebtoken');
const config = require('../index');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');
const messages = require('../constants/messages');
const Session = require('../security/session');

const extractToken = (req) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

const decodeAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    return payload.type === 'access' ? payload : null;
  } catch (err) {
    return null;
  }
};

const requireSession = (req, res, next) => {
  const token = extractToken(req);
  const payload = token && decodeAccessToken(token);

  if (!payload) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID));
  }

  Session.run(token, payload, () => next());
};

const attachSession = (req, res, next) => {
  const token = extractToken(req);
  const payload = token ? decodeAccessToken(token) : null;

  // A token was sent but it's bad/expired -> reject, don't silently treat as anonymous.
  if (token && !payload) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID));
  }

  Session.run(payload ? token : null, payload, () => next());
};

module.exports = { requireSession, attachSession };
