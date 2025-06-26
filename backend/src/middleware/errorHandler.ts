import { Request, Response, NextFunction } from 'express';
import { BaseError, ValidationError, AuthenticationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | BaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);
  // Also log to console for debugging
  console.error('API Error:', err);
  if (err && err.stack) {
    console.error('Stack:', err.stack);
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 