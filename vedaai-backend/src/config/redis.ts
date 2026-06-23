// ============================================================
// VedaAI Backend - Redis Connection (ioredis)
// Gracefully handles Redis unavailability
// ============================================================
import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = true;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const isTLS = config.redis.url.startsWith('rediss://');
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      tls: isTLS ? {} : undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          redisAvailable = false;
          logger.warn('Redis unavailable after 3 retries — cache/queue disabled');
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on('connect',  ()    => { redisAvailable = true;  logger.info('✅ Redis connected'); });
    redisClient.on('error',    (err) => { redisAvailable = false; logger.error('Redis error:', err.message); });
    redisClient.on('close',    ()    => { redisAvailable = false; logger.warn('Redis connection closed'); });
  }
  return redisClient;
};

export const isRedisAvailable = (): boolean => redisAvailable;

// Separate connection for BullMQ
export const getBullMQConnection = (): Redis => {
  const isTLS = config.redis.url.startsWith('rediss://');
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: isTLS ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    },
  });
};

// Cache helpers — silently skip if Redis is down
export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!redisAvailable) return;
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisAvailable) return null;
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch { return null; }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisAvailable) return;
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch { /* non-fatal */ }
};
