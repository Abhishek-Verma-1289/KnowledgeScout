import redisClient from "../config/redis";
import { logger } from "../utils/logger";

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isReady) {
        logger.debug("Redis not available, skipping cache get");
        return null;
      }
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 60): Promise<boolean> {
    try {
      if (!redisClient.isReady) {
        logger.debug("Redis not available, skipping cache set");
        return false;
      }
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error("Cache set error:", error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Cache exists error:", error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      logger.error("Cache pattern invalidation error:", error);
      return 0;
    }
  }

  // Query-specific cache methods
  static getQueryCacheKey(query: string, documentId?: string): string {
    const baseKey = `query:${Buffer.from(query).toString('base64')}`;
    return documentId ? `${baseKey}:doc:${documentId}` : baseKey;
  }

  static async getCachedQuery(query: string, documentId?: string): Promise<any> {
    const key = this.getQueryCacheKey(query, documentId);
    return await this.get(key);
  }

  static async setCachedQuery(query: string, result: any, documentId?: string, ttl: number = 60): Promise<void> {
    const key = this.getQueryCacheKey(query, documentId);
    await this.set(key, { ...result, fromCache: true }, ttl);
  }
}