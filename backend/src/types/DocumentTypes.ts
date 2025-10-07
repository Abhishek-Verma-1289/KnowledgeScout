export interface Document {
  id: string;
  ownerId: string;
  title: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  visibility: "private" | "public";
  shareToken?: string;
  isIndexed: boolean;
  pageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCreateData {
  title: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  visibility?: "private" | "public";
}

export interface Page {
  id: string;
  documentId: string;
  pageNumber: number;
  content: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareToken {
  id: string;
  documentId: string;
  token: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentQuery {
  limit?: number;
  offset?: number;
  visibility?: "private" | "public";
  ownerId?: string;
}