// ============================================================
// VedaAI Frontend - Socket.IO Client
// Uses polling first (works everywhere), upgrades to websocket
// ============================================================
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    socket = io(url, {
      // Start with polling — works through Vercel/proxies/firewalls
      // Socket.IO will auto-upgrade to websocket if possible
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
      forceNew: false,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      // Only log in development — suppress noisy errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Socket] Connection issue:', err.message);
      }
    });
  }
  return socket;
};

export const joinAssignmentRoom = (assignmentId: string): void => {
  getSocket().emit('join_assignment', assignmentId);
};

export const leaveAssignmentRoom = (assignmentId: string): void => {
  getSocket().emit('leave_assignment', assignmentId);
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
