import { Response } from "express";
import { ApiResponse, PaginatedResponse, ErrorResponse } from "../types/ResponseTypes";

export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): Response<PaginatedResponse<T>> => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
};

export const error = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorDetails?: string
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
    statusCode,
  });
};

export const notFound = (res: Response, resource: string = "Resource"): Response<ErrorResponse> => {
  return error(res, `${resource} not found`, 404);
};

export const unauthorized = (res: Response, message: string = "Unauthorized"): Response<ErrorResponse> => {
  return error(res, message, 401);
};

export const forbidden = (res: Response, message: string = "Forbidden"): Response<ErrorResponse> => {
  return error(res, message, 403);
};

export const serverError = (res: Response, message: string = "Internal server error"): Response<ErrorResponse> => {
  return error(res, message, 500);
};

export const badRequest = (res: Response, message: string = "Bad request"): Response<ErrorResponse> => {
  return error(res, message, 400);
};