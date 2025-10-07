import fs from "fs";
import path from "path";
import { promisify } from "util";

// Promisify fs functions
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const unlink = promisify(fs.unlink);
export const mkdir = promisify(fs.mkdir);
export const stat = promisify(fs.stat);

// Supported file types
export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const isValidFileType = (mimeType: string): boolean => {
  return SUPPORTED_MIME_TYPES.includes(mimeType);
};

export const isValidFileSize = (size: number): boolean => {
  return size <= MAX_FILE_SIZE && size > 0;
};

export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");
  
  return `${timestamp}_${random}_${sanitizedBaseName}${extension}`;
};

export const ensureUploadDir = async (uploadDir: string): Promise<void> => {
  try {
    await stat(uploadDir);
  } catch (error) {
    // Directory doesn't exist, create it
    await mkdir(uploadDir, { recursive: true });
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    console.warn(`Failed to delete file: ${filePath}`, error);
  }
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};