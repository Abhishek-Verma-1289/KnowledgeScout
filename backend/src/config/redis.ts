import { createClient } from "redis";
import { logger } from "../utils/logger";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.warn("Redis connection failed, continuing without caching:", error);
    // Don't throw error - continue without Redis for development
  }
};

export { redisClient };
export default redisClient;