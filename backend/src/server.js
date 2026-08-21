// Entry point — starts HTTP server
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
