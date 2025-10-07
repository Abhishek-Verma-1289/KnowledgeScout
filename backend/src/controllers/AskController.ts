import { Request, Response } from "express";
import { SearchService } from "../services/SearchService";
import { CacheService } from "../services/CacheService";
import { success, error } from "../utils/response";
import { AskRequest } from "../types/ResponseTypes";
import { logger } from "../utils/logger";
import Joi from "joi";

// Validation schema
const askSchema = Joi.object({
  query: Joi.string().min(1).max(1000).required(),
  k: Joi.number().integer().min(1).max(20).optional().default(5),
  documentId: Joi.string().uuid().optional(),
});

export class AskController {
  static async askQuestion(req: Request, res: Response): Promise<Response> {
    try {
      // Validate input
      const { error: validationError, value } = askSchema.validate(req.body);
      if (validationError) {
        return error(res, validationError.details[0].message, 400);
      }

      const askRequest: AskRequest = value;
      const { query, k, documentId } = askRequest;

      logger.info(`Processing question: "${query.substring(0, 50)}..." from ${req.ip}`);

      // Check cache first (60 seconds TTL as per requirements)
      const cacheKey = CacheService.getQueryCacheKey(query, documentId);
      const cachedResult = await CacheService.getCachedQuery(query, documentId);

      if (cachedResult) {
        logger.info(`Returning cached result for query: ${query.substring(0, 50)}...`);
        return success(res, {
          ...cachedResult,
          fromCache: true
        });
      }

      // Process new question
      const result = await SearchService.answerQuestion(askRequest);

      // Cache the result for 60 seconds
      await CacheService.setCachedQuery(query, result, documentId, 60);

      logger.info(`Question answered successfully: ${result.queryId}`);
      return success(res, result);

    } catch (err: any) {
      logger.error("Ask question error:", err);
      
      if (err.message.includes("not found")) {
        return error(res, "Document not found or access denied", 404);
      }
      
      return error(res, "Failed to process question", 500);
    }
  }

  static async getQueryHistory(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      // This is a placeholder - you could implement query history storage
      // For now, return empty array
      logger.info(`Query history requested by user: ${req.user.userId}`);
      
      return success(res, {
        queries: [],
        message: "Query history feature not yet implemented"
      });

    } catch (err: any) {
      logger.error("Get query history error:", err);
      return error(res, "Failed to retrieve query history", 500);
    }
  }
}