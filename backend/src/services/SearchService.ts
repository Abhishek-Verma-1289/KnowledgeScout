import OpenAI from "openai";
import Page from "../models/Page";
import Document from "../models/Document";
import { EmbeddingService } from "./EmbeddingService";
import config from "../config/env";
import { logger } from "../utils/logger";
import { AskRequest, AskResponse } from "../types/ResponseTypes";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export class SearchService {
  static async searchSimilarContent(
    query: string, 
    k: number = 5, 
    documentId?: string
  ): Promise<Page[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      
      // Build where clause
      const whereClause: any = {};
      if (documentId) {
        whereClause.documentId = documentId;
      }

      // Get all pages (in a real implementation, you'd use vector similarity search)
      const pages = await Page.findAll({
        where: whereClause,
        include: [{
          model: Document,
          as: 'document',
          attributes: ['id', 'title', 'visibility', 'ownerId']
        }],
        limit: k * 3 // Get more to filter and rank
      });

      // Calculate cosine similarity (simple implementation)
      const pagesWithSimilarity = pages.map(page => {
        const similarity = this.calculateCosineSimilarity(
          queryEmbedding, 
          page.embedding || []
        );
        return { page, similarity };
      });

      // Sort by similarity and return top k
      return pagesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
        .map(item => item.page);
        
    } catch (error) {
      logger.error("Error searching similar content:", error);
      throw error;
    }
  }

  static async answerQuestion(request: AskRequest): Promise<AskResponse> {
    try {
      const { query, k = 5, documentId } = request;
      
      logger.info(`Processing question: ${query.substring(0, 100)}...`);

      // Find relevant pages
      const relevantPages = await this.searchSimilarContent(query, k, documentId);

      if (relevantPages.length === 0) {
        return {
          answer: "I couldn't find any relevant information to answer your question.",
          sources: [],
          fromCache: false,
          queryId: this.generateQueryId(),
        };
      }

      // Prepare context from relevant pages
      const context = relevantPages
        .map(page => `[Document: ${(page as any).document?.title || 'Unknown'}, Page: ${page.pageNumber}]\n${page.content}`)
        .join('\n\n');

      // Generate answer using OpenAI
      const answer = await this.generateAnswer(query, context);

      // Prepare sources
      const sources = relevantPages.map((page, index) => ({
        documentId: page.documentId,
        documentTitle: (page as any).document?.title || 'Unknown Document',
        pageNumber: page.pageNumber,
        content: page.content.substring(0, 200) + '...',
        relevanceScore: Math.max(0.5, 1 - (index * 0.1)) // Mock relevance score
      }));

      return {
        answer,
        sources,
        fromCache: false,
        queryId: this.generateQueryId(),
      };

    } catch (error) {
      logger.error("Error answering question:", error);
      throw error;
    }
  }

  private static async generateAnswer(query: string, context: string): Promise<string> {
    try {
      if (!config.OPENAI_API_KEY) {
        return `Based on the available documents, here's what I found regarding "${query}". This is a mock answer as no OpenAI API key is configured.`;
      }

      const prompt = `
Context from documents:
${context}

Question: ${query}

Please provide a comprehensive answer based on the context above. If the context doesn't contain enough information to answer the question, please say so. Always reference the specific documents and pages where you found the information.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that answers questions based on provided document context. Always cite your sources with document names and page numbers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || "I couldn't generate an answer at this time.";
      
    } catch (error) {
      logger.error("Error generating answer with OpenAI:", error);
      return "I encountered an error while generating the answer. Please try again.";
    }
  }

  private static calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] ** 2;
      normB += vectorB[i] ** 2;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private static generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}