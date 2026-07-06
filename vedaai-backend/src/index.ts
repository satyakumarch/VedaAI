// ============================================================
// VedaAI Backend - Main Entry Point
// ============================================================
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { initSocketServer } from './websocket/socketManager';
import { errorHandler, notFound } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import assignmentRoutes from './routes/assignments';
import paperRoutes from './routes/papers';
import groupRoutes from './routes/groups';

const app = express();
const httpServer = http.createServer(app);

// ── Security & Middleware ────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // In development or if CORS_ORIGIN is *, allow everything
      if (config.env === 'development' || config.cors.origin === '*') {
        return callback(null, true);
      }
      // Allow requests with no origin (mobile, curl, Postman)
      if (!origin) return callback(null, true);

      // Support comma-separated list of allowed origins
      const allowed = config.cors.origin
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      if (allowed.includes('*') || allowed.includes(origin)) {
        callback(null, true);
      } else {
        // Log the blocked origin for debugging
        logger.warn(`CORS blocked origin: ${origin} | Allowed: ${allowed.join(', ')}`);
        callback(null, true); // temporarily allow all — remove after confirming env var is set
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Rate limiting — relaxed for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: () => config.env === 'development', // skip entirely in dev
});
app.use('/api', limiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// ── Keep-alive ping (prevents Render free tier sleep) ────────
if (config.env === 'production') {
  const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${config.port}`;
  setInterval(async () => {
    try {
      const http = await import('http');
      const https = await import('https');
      const url = new URL(`${SELF_URL}/health`);
      const client = url.protocol === 'https:' ? https : http;
      client.get(url.href, () => {}).on('error', () => {});
    } catch { /* non-fatal */ }
  }, 14 * 60 * 1000); // ping every 14 minutes
  logger.info('✅ Keep-alive pinger started (every 14 min)');
}

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/groups', groupRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ────────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();

    // Redis is optional — server works without it (no queue/cache)
    try {
      getRedisClient();
    } catch (redisErr) {
      logger.warn('Redis unavailable — queue and cache disabled:', redisErr);
    }

    initSocketServer(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`🚀 VedaAI Backend running on port ${config.port} [${config.env}]`);
      logger.info(`📡 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
