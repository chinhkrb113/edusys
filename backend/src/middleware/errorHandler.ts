import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    code = 'FOREIGN_KEY_CONSTRAINT';
    message = 'Referenced resource does not exist';
  }

  // Log error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    statusCode,
    code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    details: error.details
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalMessage: error.message
      })
    }
  });
};

export const createError = (
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: any
): AppError => {
  const error: AppError = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};