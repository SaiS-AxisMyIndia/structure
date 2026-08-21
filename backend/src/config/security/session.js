// Request-scoped auth session. Despite the "AsyncLocalStorage" name this is
// NOT a persistent/global store like browser localStorage — the middleware
// opens a brand-new, isolated context per incoming request (Session.run(...)
// in ../middlewares/session.middleware.js), and it's discarded the moment
// that request finishes. This just lets Session.getX() be read anywhere
// (controller/service/repo) for the current call only, without threading
// `req` through every function signature.
const { AsyncLocalStorage } = require('async_hooks');
const jwt = require('jsonwebtoken');
const config = require('../index');
const ApiError = require('../utils/apiError');
const httpStatus = require('../constants/httpStatus');
const messages = require('../constants/messages');

// One context per request, never shared or reused across requests.
const requestContext = new AsyncLocalStorage();

const sign = (id, role, type, expiresIn) =>
  jwt.sign({ id, role, type }, config.jwt.secret, { expiresIn });

class Session {
  // Issue a fresh access + refresh token pair for a user.
  static generate(id, role) {
    return {
      accessToken: sign(id, role, 'access', config.jwt.accessExpiresIn),
      refreshToken: sign(id, role, 'refresh', config.jwt.refreshExpiresIn),
    };
  }

  // Exchange a valid refresh token for a new access + refresh token pair.
  static refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.secret);
    } catch (err) {
      throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID);
    }

    if (payload.type !== 'refresh') {
      throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID);
    }

    return Session.generate(payload.id, payload.role);
  }

  // Clear the session for the rest of this request. JWTs here are stateless
  // (no server-side blacklist/store), so this doesn't revoke the tokens
  // themselves — the client is responsible for discarding both. Add a
  // revocation store later if server-side invalidation becomes a requirement.
  static logout() {
    const store = requestContext.getStore();
    if (store) {
      store.payload = null;
      store.token = null;
    }
  }

  // Opens a fresh, isolated context for this one request and runs `fn`
  // inside it, with `token` (raw access token string) and `payload` (its
  // decoded data object, or null) bound as the active session. Nothing here
  // outlives `fn` or leaks to any other request. Called by the session
  // middleware only, once per incoming request.
  static run(token, payload, fn) {
    return requestContext.run({ token, payload }, fn);
  }

  // Decoded data object for the current request. Throws 401 if there is none.
  static get() {
    const payload = Session.tryGet();
    if (!payload) {
      throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID);
    }
    return payload;
  }

  static getId() {
    return Session.get().id;
  }

  static getRole() {
    return Session.get().role;
  }

  // Raw access token string for the current request. Throws 401 if there is none.
  static token() {
    const token = Session.tryToken();
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, messages.AUTH.TOKEN_INVALID);
    }
    return token;
  }

  // Same as get()/getId()/getRole()/token(), but return null instead of
  // throwing — for routes where auth is optional (paired with attachSession).
  static tryGet() {
    const store = requestContext.getStore();
    return store?.payload ?? null;
  }

  static tryId() {
    return Session.tryGet()?.id ?? null;
  }

  static tryRole() {
    return Session.tryGet()?.role ?? null;
  }

  static tryToken() {
    const store = requestContext.getStore();
    return store?.token ?? null;
  }
}

module.exports = Session;
