import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  OPENAI_API_KEY: string;
  FRONTEND_URL: string;
  MAX_FILE_SIZE: number;
  CACHE_TTL: number;
}

const config: Config = {
  PORT: parseInt(process.env.PORT || "8000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/knowledgescout",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  CACHE_TTL: parseInt(process.env.CACHE_TTL || "60", 10), // 60 seconds
};

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
}

export default config;