import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/UserTypes";
import { unauthorized } from "../utils/response";
import config from "../config/env";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return unauthorized(res, "No authorization header provided");
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return unauthorized(res, "No token provided");
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return unauthorized(res, "Invalid token");
    }
    if (error instanceof jwt.TokenExpiredError) {
      return unauthorized(res, "Token expired");
    }
    return unauthorized(res, "Token verification failed");
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  if (!req.user) {
    return unauthorized(res, "Authentication required");
  }

  if (req.user.role !== "admin") {
    return unauthorized(res, "Admin access required");
  }

  next();
};