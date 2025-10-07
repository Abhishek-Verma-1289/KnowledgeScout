import { Request, Response, NextFunction } from "express";
import { CacheService } from "../services/CacheService";
import { logger } from "../utils/logger";
import crypto from "crypto";

export const cacheMiddleware = (ttlSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      // Create cache key from URL and query params
      const cacheKey = generateCacheKey(req);
      
      // Try to get cached response
      const cachedResponse = await CacheService.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Parse cached response and add cache indicator
        const parsedResponse = JSON.parse(cachedResponse);
        if (typeof parsedResponse === "object" && parsedResponse !== null) {
          parsedResponse.fromCache = true;
        }
        
        return res.json(parsedResponse);
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set(cacheKey, JSON.stringify(body), ttlSeconds)
            .catch(error => {
              logger.error("Failed to cache response:", error);
            });
        }
        
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      // Continue without caching if there's an error
      next();
    }
  };
};

const generateCacheKey = (req: Request): string => {
  const { url, query } = req;
  const userId = req.user?.userId || "anonymous";
  
  // Create deterministic cache key
  const keyData = {
    url,
    query,
    userId,
  };
  
  return `cache:${crypto.createHash("md5").update(JSON.stringify(keyData)).digest("hex")}`;
};

// Cache invalidation middleware for POST/PUT/DELETE operations
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            await CacheService.deleteByPattern(pattern);
          }
          logger.debug(`Invalidated cache patterns: ${patterns.join(", ")}`);
        } catch (error) {
          logger.error("Failed to invalidate cache:", error);
        }
      }
    };

    // Override response methods to trigger cache invalidation
    res.json = function(body: any) {
      invalidateCache();
      return originalJson(body);
    };

    res.send = function(body: any) {
      invalidateCache();
      return originalSend(body);
    };

    next();
  };
};