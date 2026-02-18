import { createServer } from 'http';
import app from './app';
import config from './infrastructure/config';
import logger from './infrastructure/logger';
import { createScoringWorker } from './modules/queue/scoring.worker';
import redisClient from './infrastructure/redis';
import { initializeSocketIO } from './infrastructure/socket';
import { initSentry } from './infrastructure/sentry';

// Initialize Sentry before anything else
initSentry();

// Initialize Redis connection
redisClient.connect();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);
logger.info('Socket.IO initialized');

const server = httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  
  // Start queue worker
  const worker = createScoringWorker();
  logger.info('Queue worker started');

  // Start cron job (requires userId - in production, you'd fetch jobs for all users)
  // For now, cron is disabled as it requires a userId
  // startJobFetcherCron(userId);
  
  // Store worker reference for graceful shutdown
  (global as { worker?: ReturnType<typeof createScoringWorker> }).worker = worker;
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Close queue worker
  const worker = (global as { worker?: ReturnType<typeof createScoringWorker> }).worker;
  if (worker) {
    await worker.close();
    logger.info('Queue worker closed');
  }

  // Close Redis connection
  await redisClient.disconnect();
  logger.info('Redis connection closed');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});
