// Central environment config loader
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  db: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/app',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
};

module.exports = config;
