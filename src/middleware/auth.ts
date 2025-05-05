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
      console.log('[AUTH] Verifying token...');
      console.log('[AUTH] Backend Firebase project ID:', process.env.FIREBASE_PROJECT_ID);
      
      // Decode token without verification to get issuer info for debugging
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const tokenPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('[AUTH] Token claims:', {
            iss: tokenPayload.iss,
            aud: tokenPayload.aud,
            exp: tokenPayload.exp ? new Date(tokenPayload.exp * 1000).toISOString() : 'unknown',
            user_id: tokenPayload.user_id,
            email: tokenPayload.email,
          });
        } catch (decodeErr) {
          console.error('[AUTH] Could not decode token for debugging:', decodeErr);
        }
      }
      
      const decodedToken = await auth.verifyIdToken(token);
      console.log('[AUTH] ✅ Token verified successfully for user:', decodedToken.uid);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    } catch (error: any) {
      console.error('[AUTH] ❌ Token verification failed:', error.message);
      console.error('[AUTH] Error code:', error.code);
      console.error('[AUTH] Error details:', error);
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code
        } : undefined
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
