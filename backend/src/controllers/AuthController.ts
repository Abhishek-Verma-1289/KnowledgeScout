import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { success, error } from "../utils/response";
import { UserCreateData, UserLoginData } from "../types/UserTypes";
import Joi from "joi";
import { logger } from "../utils/logger";

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      // Validate input
      const { error: validationError, value } = registerSchema.validate(req.body);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const userData: UserCreateData = value;

      // Register user
      const result = await AuthService.register(userData);

      logger.info(`User registered successfully: ${userData.email}`);
      return success(res, result, "User registered successfully", 201);

    } catch (err: any) {
      logger.error("Registration error:", err);
      
      if (err.message.includes("already exists")) {
        return error(res, "User already exists with this email", 409);
      }
      
      return error(res, "Registration failed", 500);
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      // Validate input
      const { error: validationError, value } = loginSchema.validate(req.body);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const loginData: UserLoginData = value;

      // Login user
      const result = await AuthService.login(loginData);

      logger.info(`User logged in successfully: ${loginData.email}`);
      return success(res, result, "Login successful");

    } catch (err: any) {
      logger.error("Login error:", err);
      
      if (err.message.includes("Invalid credentials")) {
        return error(res, "Invalid email or password", 401);
      }
      
      return error(res, "Login failed", 500);
    }
  }

  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "User not authenticated", 401);
      }

      return success(res, {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      }, "Profile retrieved successfully");

    } catch (err: any) {
      logger.error("Get profile error:", err);
      return error(res, "Failed to get profile", 500);
    }
  }
}