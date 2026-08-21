// DB connection setup
const config = require('./index');
const logger = require('./logger');

const connectDB = async () => {
  try {
    // Example (mongoose):
    // const mongoose = require('mongoose');
    // await mongoose.connect(config.db.uri);
    logger.info('Database connected');
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
