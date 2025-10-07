import app from "./app";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info("✅ Database connected successfully");

    // Connect to Redis
    await connectRedis();
    logger.info("✅ Redis connected successfully");

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 KnowledgeScout server running on port ${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "*"}`);
    });

  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();