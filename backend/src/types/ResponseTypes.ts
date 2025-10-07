export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

export interface AskRequest {
  query: string;
  k?: number;
  documentId?: string;
}

export interface AskResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    documentTitle: string;
    pageNumber: number;
    content: string;
    relevanceScore: number;
  }>;
  fromCache: boolean;
  queryId: string;
}

export interface IndexStats {
  totalDocuments: number;
  totalPages: number;
  indexedDocuments: number;
  unindexedDocuments: number;
  totalEmbeddings: number;
  lastIndexUpdate: Date;
}