import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Document from "../models/Document";
import User from "../models/User";
import ShareToken from "../models/ShareToken";
import { EmbeddingService } from "../services/EmbeddingService";
import { CacheService } from "../services/CacheService";
import { success, error, paginated, notFound } from "../utils/response";
import { 
  isValidFileType, 
  isValidFileSize, 
  generateFileName, 
  ensureUploadDir 
} from "../utils/fileUtils";
import { logger } from "../utils/logger";
import { DocumentQuery } from "../types/DocumentTypes";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";

// File upload configuration
const uploadDir = path.join(process.cwd(), "uploads");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, TXT, MD, DOC, and DOCX files are allowed."));
    }
  },
});

// Validation schemas
const uploadSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  visibility: Joi.string().valid("private", "public").optional().default("private"),
});

const querySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  offset: Joi.number().integer().min(0).optional().default(0),
  visibility: Joi.string().valid("private", "public").optional(),
});

export class DocsController {
  static uploadMiddleware = upload.single("file");

  static async uploadDocument(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      if (!req.file) {
        return error(res, "No file uploaded", 400);
      }

      // Validate request body
      const { error: validationError, value } = uploadSchema.validate(req.body);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const { title, visibility } = value;

      // Validate file
      if (!isValidFileSize(req.file.size)) {
        return error(res, "File size exceeds 10MB limit", 400);
      }

      // Ensure upload directory exists
      await ensureUploadDir(uploadDir);

      // Generate unique filename
      const filename = generateFileName(req.file.originalname);
      const filePath = path.join(uploadDir, filename);

      // Save file to disk
      await fs.promises.writeFile(filePath, req.file.buffer);

      // Create document record
      const document = await Document.create({
        ownerId: req.user.userId,
        title,
        filename: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        visibility,
      });

      // Process document for embedding (async)
      setImmediate(async () => {
        try {
          const content = req.file!.buffer.toString('utf-8'); // Simple text extraction
          await EmbeddingService.processAndStoreDocument(document.id, content);
          logger.info(`Document ${document.id} processed and indexed successfully`);
        } catch (err) {
          logger.error(`Failed to process document ${document.id}:`, err);
        }
      });

      // Invalidate cache
      await CacheService.invalidatePattern("docs:*");

      logger.info(`Document uploaded successfully: ${document.id} by user ${req.user.userId}`);
      
      return success(res, {
        document_id: document.id,
        title: document.title,
        filename: document.filename,
        size: document.fileSize,
        visibility: document.visibility,
        isIndexed: document.isIndexed,
      }, "Document uploaded successfully", 201);

    } catch (err: any) {
      logger.error("Document upload error:", err);
      return error(res, "Failed to upload document", 500);
    }
  }

  static async getDocuments(req: Request, res: Response): Promise<Response> {
    try {
      // Validate query parameters
      const { error: validationError, value } = querySchema.validate(req.query);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const { limit, offset, visibility }: DocumentQuery = value;

      // Build where clause
      const whereClause: any = {};
      
      // If user is authenticated, show their private docs + public docs
      // If not authenticated, show only public docs
      if (req.user) {
        if (visibility) {
          whereClause.visibility = visibility;
          if (visibility === "private") {
            whereClause.ownerId = req.user.userId;
          }
        } else {
          whereClause[Symbol.for("or")] = [
            { visibility: "public" },
            { ownerId: req.user.userId }
          ];
        }
      } else {
        whereClause.visibility = "public";
      }

      // Get documents with pagination
      const { rows: documents, count: total } = await Document.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: "owner",
          attributes: ["name", "email"]
        }],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const pageNum = Math.floor((offset || 0) / (limit || 10)) + 1;

      return paginated(res, documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        size: doc.fileSize,
        mimeType: doc.mimeType,
        visibility: doc.visibility,
        isIndexed: doc.isIndexed,
        pageCount: doc.pageCount,
        owner: (doc as any).owner?.name || "Unknown",
        createdAt: doc.createdAt,
      })), total, pageNum, limit || 10);

    } catch (err: any) {
      logger.error("Get documents error:", err);
      return error(res, "Failed to retrieve documents", 500);
    }
  }

  static async getDocumentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const document = await Document.findByPk(id, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["name", "email"]
        }]
      });

      if (!document) {
        return notFound(res, "Document");
      }

      // Check access permissions
      const canAccess = 
        document.visibility === "public" ||
        (req.user && document.ownerId === req.user.userId) ||
        (req.query.token && await this.validateShareToken(id, req.query.token as string));

      if (!canAccess) {
        return error(res, "Access denied", 403);
      }

      return success(res, {
        id: document.id,
        title: document.title,
        filename: document.filename,
        size: document.fileSize,
        mimeType: document.mimeType,
        visibility: document.visibility,
        isIndexed: document.isIndexed,
        pageCount: document.pageCount,
        owner: (document as any).owner?.name || "Unknown",
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      });

    } catch (err: any) {
      logger.error("Get document by ID error:", err);
      return error(res, "Failed to retrieve document", 500);
    }
  }

  static async deleteDocument(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      const { id } = req.params;

      const document = await Document.findByPk(id);
      if (!document) {
        return notFound(res, "Document");
      }

      // Check ownership or admin role
      if (document.ownerId !== req.user.userId && req.user.role !== "admin") {
        return error(res, "Access denied", 403);
      }

      // Delete file from filesystem
      try {
        await fs.promises.unlink(document.filePath);
      } catch (fileErr) {
        logger.warn(`Failed to delete file: ${document.filePath}`, fileErr);
      }

      // Delete document record (cascade will delete pages)
      await document.destroy();

      // Invalidate cache
      await CacheService.invalidatePattern("docs:*");

      logger.info(`Document deleted: ${id} by user ${req.user.userId}`);
      return success(res, null, "Document deleted successfully");

    } catch (err: any) {
      logger.error("Delete document error:", err);
      return error(res, "Failed to delete document", 500);
    }
  }

  static async generateShareToken(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      const { id } = req.params;

      const document = await Document.findByPk(id);
      if (!document) {
        return notFound(res, "Document");
      }

      // Check ownership
      if (document.ownerId !== req.user.userId) {
        return error(res, "Access denied", 403);
      }

      // Generate share token
      const shareToken = await ShareToken.create({
        documentId: id,
        token: uuidv4(),
      });

      return success(res, {
        token: shareToken.token,
        documentId: id,
        createdAt: shareToken.createdAt,
      }, "Share token generated successfully", 201);

    } catch (err: any) {
      logger.error("Generate share token error:", err);
      return error(res, "Failed to generate share token", 500);
    }
  }

  private static async validateShareToken(documentId: string, token: string): Promise<boolean> {
    try {
      const shareToken = await ShareToken.findOne({
        where: {
          documentId,
          token,
        }
      });

      return shareToken ? shareToken.isValid() : false;
    } catch (err) {
      logger.error("Share token validation error:", err);
      return false;
    }
  }
}