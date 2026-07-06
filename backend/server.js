import app from "./app.js";
import logger from "./logs/logger.js";

// Handle uncaught exceptions - log and keep server running
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  // Don't exit in production - keep server running
  if (process.env.NODE_ENV !== 'production') {
    console.error('Uncaught Exception:', err);
  }
});

// Handle unhandled promise rejections - log and keep server running
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.stack || reason}`);
  // Don't exit in production - keep server running
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled Rejection:', reason);
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server runs at port ${PORT}`);
});

// Set server timeouts to prevent hanging connections
server.keepAliveTimeout = 65000; // 65 seconds (more than typical load balancer timeout)
server.headersTimeout = 66000; // Slightly more than keepAliveTimeout
server.timeout = 120000; // 2 minutes for long-running requests

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
