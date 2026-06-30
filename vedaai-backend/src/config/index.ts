// ============================================================
// VedaAI Backend - Centralized Configuration
// ============================================================
import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),

  mongo: {
    uri: required('MONGODB_URI'),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'vedaai-super-secret-change-in-prod'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  openai: {
    apiKey: optional('OPENAI_API_KEY', ''),
    model: optional('OPENAI_MODEL', 'gpt-4o-mini'),
    polish: optional('OPENAI_POLISH', 'false') === 'true',
  },

  cors: {
    origin: optional('CORS_ORIGIN', 'http://localhost:3000'),
  },

  upload: {
    maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),
    allowedMimeTypes: ['application/pdf', 'text/plain'],
  },

  queue: {
    name: 'ai-generation',
    concurrency: parseInt(optional('QUEUE_CONCURRENCY', '3'), 10),
    attempts: parseInt(optional('QUEUE_ATTEMPTS', '3'), 10),
    backoffDelay: parseInt(optional('QUEUE_BACKOFF_DELAY', '5000'), 10),
  },
} as const;
