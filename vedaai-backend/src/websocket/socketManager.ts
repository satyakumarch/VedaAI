// ============================================================
// VedaAI Backend - Socket.IO Manager
// ============================================================
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';
import { JobProgressPayload } from '../types';

let io: SocketServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      // Dynamic origin — required when credentials:false but we want specific origins
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser clients
        // Allow any origin — credentials:false so wildcard is OK
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: false, // MUST be false to avoid CORS error with origin:*
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowUpgrades: true,
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      logger.debug(`Socket ${socket.id} joined room: assignment:${assignmentId}`);
    });

    socket.on('leave_assignment', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info('✅ Socket.IO server initialized');
  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const emitToAssignment = (
  assignmentId: string,
  event: string,
  payload: JobProgressPayload
): void => {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit(event, payload);
  logger.debug(`Emitted [${event}] to assignment:${assignmentId}`);
};
