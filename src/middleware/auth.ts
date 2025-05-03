import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

/**
 * Middleware to verify Firebase authentication token
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to handle anonymous authentication
 * This allows endpoints to be accessed with or without authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      // Continue without setting user
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
