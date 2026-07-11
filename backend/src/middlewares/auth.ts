import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error';
import { User } from '../models/User';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'librarian' | 'admin';
  };
}

export const validateJWT = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please sign in.', 401));
    }

    const secret = process.env.JWT_SECRET || 'development_secret_session_token_key_19283';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: 'student' | 'librarian' | 'admin' };

    // Verify user still exists in database
    const userExists = await User.findById(decoded.id).select('_id');
    if (!userExists) {
      return next(new AppError('Session user no longer exists.', 401));
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err: any) {
    logger.warn('Token validation failed:', err.message);
    next(err);
  }
};

export const requireRole = (allowedRoles: ('student' | 'librarian' | 'admin')[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};
