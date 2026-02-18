import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error' as never, (e: { message: string; target: string }) => {
  logger.error('Prisma error', { message: e.message, target: e.target });
});

prisma.$on('warn' as never, (e: { message: string; target: string }) => {
  logger.warn('Prisma warning', { message: e.message, target: e.target });
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    logger.debug('Prisma query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

export default prisma;
