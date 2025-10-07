import { Request, Response } from "express";
import Document from "../models/Document";
import Page from "../models/Page";
import IndexStats from "../models/IndexStats";
import { EmbeddingService } from "../services/EmbeddingService";
import { CacheService } from "../services/CacheService";
import { success, error } from "../utils/response";
import { IndexStats as IIndexStats } from "../types/ResponseTypes";
import { logger } from "../utils/logger";
import { Op } from "sequelize";

export class IndexController {
  static async getIndexStats(req: Request, res: Response): Promise<Response> {
    try {
      logger.info("Retrieving index statistics");

      // Calculate current statistics
      const totalDocuments = await Document.count();
      const totalPages = await Page.count();
      const indexedDocuments = await Document.count({
        where: { isIndexed: true }
      });
      const unindexedDocuments = await Document.count({
        where: { isIndexed: false }
      });
      const totalEmbeddings = await Page.count({
        where: {
          embedding: {
            [Op.ne]: null
          }
        }
      });

      // Get or create index stats record
      let indexStats = await IndexStats.findOne();
      if (!indexStats) {
        indexStats = await IndexStats.create({
          totalDocuments,
          totalPages,
          indexedDocuments,
          unindexedDocuments,
          totalEmbeddings,
          lastIndexUpdate: new Date(),
        });
      } else {
        // Update statistics
        await indexStats.update({
          totalDocuments,
          totalPages,
          indexedDocuments,
          unindexedDocuments,
          totalEmbeddings,
        });
      }

      const stats: IIndexStats = {
        totalDocuments,
        totalPages,
        indexedDocuments,
        unindexedDocuments,
        totalEmbeddings,
        lastIndexUpdate: indexStats.lastIndexUpdate,
      };

      logger.info(`Index stats retrieved: ${totalDocuments} docs, ${totalPages} pages, ${indexedDocuments} indexed`);
      return success(res, stats);

    } catch (err: any) {
      logger.error("Get index stats error:", err);
      return error(res, "Failed to retrieve index statistics", 500);
    }
  }

  static async rebuildIndex(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      // Only admin can rebuild index
      if (req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      logger.info(`Index rebuild started by admin: ${req.user.userId}`);

      // Get all documents that need reindexing
      const documents = await Document.findAll({
        where: { isIndexed: false }
      });

      if (documents.length === 0) {
        return success(res, {
          message: "No documents need reindexing",
          processedDocuments: 0,
        });
      }

      // Start rebuilding process (async)
      setImmediate(async () => {
        let processedCount = 0;
        let errorCount = 0;

        for (const document of documents) {
          try {
            // This would require implementing file content reading
            // For now, we'll just mark as processed
            await EmbeddingService.reindexDocument(document.id);
            processedCount++;
            
            logger.debug(`Reindexed document: ${document.id}`);
          } catch (err) {
            logger.error(`Failed to reindex document ${document.id}:`, err);
            errorCount++;
          }
        }

        // Update index stats
        await IndexStats.update(
          { lastIndexUpdate: new Date() },
          { where: {} }
        );

        // Invalidate all caches
        await CacheService.invalidatePattern("*");

        logger.info(`Index rebuild completed: ${processedCount} processed, ${errorCount} errors`);
      });

      return success(res, {
        message: "Index rebuild started",
        documentsToProcess: documents.length,
        status: "processing"
      }, "Index rebuild initiated", 202);

    } catch (err: any) {
      logger.error("Rebuild index error:", err);
      return error(res, "Failed to start index rebuild", 500);
    }
  }

  static async getIndexHealth(req: Request, res: Response): Promise<Response> {
    try {
      logger.info("Checking index health");

      const totalDocuments = await Document.count();
      const indexedDocuments = await Document.count({
        where: { isIndexed: true }
      });
      const documentsWithPages = await Document.count({
        include: [{
          model: Page,
          as: "pages",
          required: true
        }]
      });

      const indexHealth = {
        totalDocuments,
        indexedDocuments,
        documentsWithPages,
        indexingProgress: totalDocuments > 0 ? (indexedDocuments / totalDocuments) * 100 : 100,
        needsReindexing: totalDocuments - indexedDocuments,
        status: indexedDocuments === totalDocuments ? "healthy" : "degraded"
      };

      return success(res, indexHealth);

    } catch (err: any) {
      logger.error("Get index health error:", err);
      return error(res, "Failed to check index health", 500);
    }
  }

  static async clearCache(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return error(res, "Authentication required", 401);
      }

      // Only admin can clear cache
      if (req.user.role !== "admin") {
        return error(res, "Admin access required", 403);
      }

      logger.info(`Cache clear requested by admin: ${req.user.userId}`);

      // Clear all cache patterns
      const clearedCount = await CacheService.invalidatePattern("*");

      logger.info(`Cache cleared: ${clearedCount} entries removed`);
      return success(res, {
        clearedEntries: clearedCount,
        message: "Cache cleared successfully"
      });

    } catch (err: any) {
      logger.error("Clear cache error:", err);
      return error(res, "Failed to clear cache", 500);
    }
  }
}