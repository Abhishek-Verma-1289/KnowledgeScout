import OpenAI from "openai";
import Page from "../models/Page";
import Document from "../models/Document";
import config from "../config/env";
import { logger } from "../utils/logger";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export class EmbeddingService {
  private static readonly CHUNK_SIZE = 1000;
  private static readonly OVERLAP_SIZE = 200;

  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.warn("No OpenAI API key provided, using dummy embedding");
        return new Array(1536).fill(0).map(() => Math.random());
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  static splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunk = text.slice(start, end);
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + this.CHUNK_SIZE / 2) {
          chunks.push(text.slice(start, breakPoint + 1).trim());
          start = breakPoint + 1;
        } else {
          chunks.push(chunk.trim());
          start = end - this.OVERLAP_SIZE;
        }
      } else {
        chunks.push(chunk.trim());
        break;
      }
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  static async processAndStoreDocument(documentId: string, content: string): Promise<Page[]> {
    try {
      logger.info(`Processing document ${documentId} for embedding`);

      // Split content into chunks
      const chunks = this.splitTextIntoChunks(content);
      const pages: Page[] = [];

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        const page = await Page.create({
          documentId,
          pageNumber: i + 1,
          content: chunk,
          embedding,
        });

        pages.push(page);
        logger.debug(`Created page ${i + 1}/${chunks.length} for document ${documentId}`);
      }

      // Update document status
      await Document.update(
        { 
          isIndexed: true, 
          pageCount: pages.length 
        },
        { where: { id: documentId } }
      );

      logger.info(`Successfully processed document ${documentId} into ${pages.length} pages`);
      return pages;
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);
      throw error;
    }
  }

  static async reindexDocument(documentId: string): Promise<Page[]> {
    try {
      // Delete existing pages
      await Page.destroy({ where: { documentId } });
      
      // Get document content (you'd implement this based on your storage)
      const document = await Document.findByPk(documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      // Re-read file content and process (placeholder - implement based on your file storage)
      // const content = await readFileContent(document.filePath);
      // return await this.processAndStoreDocument(documentId, content);
      
      logger.warn(`Reindexing not fully implemented for document ${documentId}`);
      return [];
    } catch (error) {
      logger.error(`Error reindexing document ${documentId}:`, error);
      throw error;
    }
  }
}