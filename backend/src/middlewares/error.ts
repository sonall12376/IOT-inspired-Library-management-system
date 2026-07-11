import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log inside system
  if (err.statusCode >= 500) {
    logger.error('Unhandled System Error:', err);
  } else {
    logger.warn(`Operational Warning [${err.statusCode}]: ${err.message}`);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`
    });
    return;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const value = Object.keys(err.keyValue).join(', ');
    res.status(400).json({
      success: false,
      message: `Duplicate field value: ${value}. Please use another value.`
    });
    return;
  }

  // Express validation or Zod parsing errors
  if (err.name === 'ValidationError' || err.issues) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues || err.message
    });
    return;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid session token. Please sign in again.'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Session token has expired. Please sign in again.'
    });
    return;
  }

  // Send output to user
  res.status(err.statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
