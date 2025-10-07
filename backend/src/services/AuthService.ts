import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { UserCreateData, UserLoginData, JWTPayload } from "../types/UserTypes";
import config from "../config/env";
import { logger } from "../utils/logger";

export class AuthService {
  static async register(userData: UserCreateData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Create new user - cast to any to avoid Sequelize type issues
      const user = await User.create(userData as any);
      
      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  static async login(loginData: UserLoginData) {
    try {
      // Find user by email
      const user = await User.findOne({ where: { email: loginData.email } });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check password
      const isValidPassword = await user.comparePassword(loginData.password);
      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  static generateToken(payload: any): string {
    // Simple JWT signing with any types to avoid complex type issues
    return (jwt as any).sign(payload, config.JWT_SECRET, {
      expiresIn: "24h", // Hardcoded to avoid type issues
    });
  }

  static verifyToken(token: string): any {
    return (jwt as any).verify(token, config.JWT_SECRET);
  }
}