import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwtService from './jwt';
import userRepository from '../modules/users/user.repository';
import logger from './logger';

let io: SocketIOServer | null = null;

export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const payload = jwtService.verifyToken(token);
      const user = await userRepository.findById(payload.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      (socket as any).userId = user.id;
      (socket as any).tenantId = user.tenantId;
      (socket as any).role = user.role;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const tenantId = (socket as any).tenantId;

    logger.info('Socket connected', { userId, tenantId });

    // Join tenant room
    socket.join(`tenant:${tenantId}`);

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId, tenantId });
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
};

export const emitToTenant = (tenantId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
    logger.debug('Emitted event to tenant', { tenantId, event });
  }
};
