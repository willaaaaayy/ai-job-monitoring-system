import Redis from 'ioredis';
import config from './config';
import logger from './logger';

class RedisClient {
  private client: Redis | null = null;

  /**
   * Initialize Redis connection
   */
  connect(): Redis {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = new Redis(config.redisUrl, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: true,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (error: Error) => {
        logger.error('Redis client error', { error: error.message });
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
      });

      return this.client;
    } catch (error) {
      logger.error('Failed to create Redis client', { error });
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  /**
   * Check Redis health
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis client disconnected');
    }
  }
}

export default new RedisClient();
