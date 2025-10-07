import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/authRoutes";
import docsRoutes from "./routes/docsRoutes";
import askRoutes from "./routes/askRoutes";
import indexRoutes from "./routes/indexRoutes";
import adminRoutes from "./routes/adminRoutes";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "KnowledgeScout API",
      version: "1.0.0",
      description: "Document Q&A System - Hackathon Ready",
      features: [
        "Document upload and embedding",
        "Intelligent Q&A with source references", 
        "60-second query caching",
        "Private documents with share tokens",
        "Admin dashboard and user management"
      ],
      endpoints: {
        "POST /api/docs": "Upload document (multipart)",
        "GET /api/docs": "List documents with pagination",
        "POST /api/ask": "Ask question {query, k}",
        "GET /api/index/stats": "Get index statistics",
        "POST /api/index/rebuild": "Rebuild index (admin)"
      }
    }
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api", docsRoutes);
app.use("/api", askRoutes);
app.use("/api", indexRoutes);
app.use("/api", adminRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;