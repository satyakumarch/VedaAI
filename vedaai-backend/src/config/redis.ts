// ============================================================
// VedaAI Backend - Redis Connection (ioredis)
// ============================================================
import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

// Separate connection for BullMQ (needs maxRetriesPerRequest: null)
export const getBullMQConnection = (): Redis => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

// Cache helpers
export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
};

export const cacheDel = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};
