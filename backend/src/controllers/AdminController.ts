import { Request, Response } from "express";
import User from "../models/User";
import Document from "../models/Document";
import Page from "../models/Page";
import IndexStats from "../models/IndexStats";
import { success, error, paginated } from "../utils/response";
import { logger } from "../utils/logger";
import Joi from "joi";

// Validation schemas
const userQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  offset: Joi.number().integer().min(0).optional().default(0),
  role: Joi.string().valid("user", "admin").optional(),
});

const updateUserSchema = Joi.object({
  role: Joi.string().valid("user", "admin").required(),
});

export class AdminController {
  static async getDashboardStats(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      logger.info(`Admin dashboard accessed by: ${req.user.userId}`);

      // Get comprehensive statistics
      const [
        totalUsers,
        totalDocuments,
        totalPages,
        publicDocuments,
        privateDocuments,
        indexedDocuments,
        totalAdmins,
        recentUsers,
        recentDocuments
      ] = await Promise.all([
        User.count(),
        Document.count(),
        Page.count(),
        Document.count({ where: { visibility: "public" } }),
        Document.count({ where: { visibility: "private" } }),
        Document.count({ where: { isIndexed: true } }),
        User.count({ where: { role: "admin" } }),
        User.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "email", "name", "role", "createdAt"]
        }),
        Document.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "title", "visibility", "isIndexed", "createdAt"],
          include: [{
            model: User,
            as: "owner",
            attributes: ["name", "email"]
          }]
        })
      ]);

      const dashboardStats = {
        overview: {
          totalUsers,
          totalDocuments,
          totalPages,
          totalAdmins,
        },
        documents: {
          public: publicDocuments,
          private: privateDocuments,
          indexed: indexedDocuments,
          unindexed: totalDocuments - indexedDocuments,
        },
        recent: {
          users: recentUsers,
          documents: recentDocuments,
        },
        systemHealth: {
          indexingStatus: totalDocuments > 0 ? (indexedDocuments / totalDocuments) * 100 : 100,
          status: indexedDocuments === totalDocuments ? "healthy" : "needs_attention"
        }
      };

      return success(res, dashboardStats);

    } catch (err: any) {
      logger.error("Get dashboard stats error:", err);
      return error(res, "Failed to retrieve dashboard statistics", 500);
    }
  }

  static async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      // Validate query parameters
      const { error: validationError, value } = userQuerySchema.validate(req.query);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const { limit, offset, role } = value;

      // Build where clause
      const whereClause: any = {};
      if (role) {
        whereClause.role = role;
      }

      // Get users with pagination
      const { rows: users, count: total } = await User.findAndCountAll({
        where: whereClause,
        attributes: ["id", "email", "name", "role", "createdAt", "updatedAt"],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const page = Math.floor(offset / limit) + 1;

      logger.info(`Admin retrieved users: ${users.length} of ${total} total`);
      return paginated(res, users, total, page, limit);

    } catch (err: any) {
      logger.error("Get users error:", err);
      return error(res, "Failed to retrieve users", 500);
    }
  }

  static async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      const { id } = req.params;

      // Validate input
      const { error: validationError, value } = updateUserSchema.validate(req.body);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const { role } = value;

      // Find and update user
      const user = await User.findByPk(id);
      if (!user) {
        return error(res, "User not found", 404);
      }

      // Prevent admin from demoting themselves
      if (user.id === req.user.userId && role === "user") {
        return error(res, "Cannot demote yourself from admin role", 400);
      }

      await user.update({ role });

      logger.info(`Admin ${req.user.userId} updated user ${id} role to ${role}`);
      return success(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        updatedAt: user.updatedAt,
      }, "User updated successfully");

    } catch (err: any) {
      logger.error("Update user error:", err);
      return error(res, "Failed to update user", 500);
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      const { id } = req.params;

      // Find user
      const user = await User.findByPk(id);
      if (!user) {
        return error(res, "User not found", 404);
      }

      // Prevent admin from deleting themselves
      if (user.id === req.user.userId) {
        return error(res, "Cannot delete your own account", 400);
      }

      // Delete user (this will cascade delete their documents)
      await user.destroy();

      logger.info(`Admin ${req.user.userId} deleted user ${id}`);
      return success(res, null, "User deleted successfully");

    } catch (err: any) {
      logger.error("Delete user error:", err);
      return error(res, "Failed to delete user", 500);
    }
  }

  static async getAllDocuments(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      // Validate query parameters (reuse docs query schema)
      const { limit = 20, offset = 0 } = req.query;

      // Get all documents (admin can see everything)
      const { rows: documents, count: total } = await Document.findAndCountAll({
        include: [{
          model: User,
          as: "owner",
          attributes: ["name", "email"]
        }],
        limit: Number(limit),
        offset: Number(offset),
        order: [["createdAt", "DESC"]],
      });

      const page = Math.floor(Number(offset) / Number(limit)) + 1;

      const documentsWithStats = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        size: doc.fileSize,
        mimeType: doc.mimeType,
        visibility: doc.visibility,
        isIndexed: doc.isIndexed,
        pageCount: doc.pageCount,
        owner: {
          name: doc.owner?.name || "Unknown",
          email: doc.owner?.email || "Unknown"
        },
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      logger.info(`Admin retrieved all documents: ${documents.length} of ${total} total`);
      return paginated(res, documentsWithStats, total, page, Number(limit));

    } catch (err: any) {
      logger.error("Get all documents error:", err);
      return error(res, "Failed to retrieve documents", 500);
    }
  }

  static async getSystemLogs(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user || req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      // This is a placeholder - in a real implementation, you'd read actual log files
      const mockLogs = [
        {
          timestamp: new Date(),
          level: "INFO",
          message: "User authentication successful",
          userId: req.user.userId,
        },
        {
          timestamp: new Date(Date.now() - 60000),
          level: "INFO", 
          message: "Document uploaded successfully",
          userId: "user-123",
        },
        {
          timestamp: new Date(Date.now() - 120000),
          level: "WARN",
          message: "Rate limit exceeded for IP",
          ip: "192.168.1.100",
        }
      ];

      logger.info(`Admin accessed system logs: ${req.user.userId}`);
      return success(res, {
        logs: mockLogs,
        message: "System logs (last 24 hours)"
      });

    } catch (err: any) {
      logger.error("Get system logs error:", err);
      return error(res, "Failed to retrieve system logs", 500);
    }
  }
}