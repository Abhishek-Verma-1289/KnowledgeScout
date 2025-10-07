import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // Log error details
  logger.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle specific error types
  if (error.name === "SequelizeValidationError") {
    statusCode = 400;
    message = "Validation error";
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "Resource already exists";
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400;
    message = "Invalid reference";
  }

  if (error.name === "MulterError") {
    statusCode = 400;
    message = `File upload error: ${error.message}`;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    message = "Internal Server Error";
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
};