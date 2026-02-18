import { io, Socket } from 'socket.io-client';
import { authUtils } from './auth';

let socket: Socket | null = null;

export const connectWebSocket = (): Socket | null => {
  if (socket?.connected) {
    return socket;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const token = authUtils.getToken();

  if (!token) {
    console.warn('No authentication token available for WebSocket connection');
    return null;
  }

  socket = io(API_URL, {
    auth: {
      token,
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
};

export const disconnectWebSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
