import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { ApiError } from '../middleware/error';
import { AuthRequest, AuthResponse } from '../types';

/**
 * Controller for authentication-related operations
 */
export const authController = {
  /**
   * Create anonymous user
   */
  createAnonymousUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create anonymous user
      const userRecord = await auth.createUser({});
      
      // Create user document in Firestore
      const userDoc = {
        id: userRecord.uid,
        createdAt: new Date().toISOString(),
        proStatus: false,
      };
      
      await db.collection('users').doc(userRecord.uid).set(userDoc);
      
      // Create custom token for the user
      const token = await auth.createCustomToken(userRecord.uid);
      
      res.status(201).json({
        success: true,
        data: {
          userId: userRecord.uid,
          token,
          expiresIn: 3600, // 1 hour
        } as AuthResponse,
      });
    } catch (error) {
      next(new ApiError('Failed to create anonymous user', 500));
    }
  },
  
  /**
   * Sign in with token
   */
  signInWithToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body as AuthRequest;
      
      if (!idToken) {
        return next(new ApiError('ID token is required', 400));
      }
      
      // Verify ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Check if user exists in Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        await db.collection('users').doc(uid).set({
          id: uid,
          createdAt: new Date().toISOString(),
          proStatus: false,
          email: decodedToken.email,
        });
      }
      
      // Create custom token
      const token = await auth.createCustomToken(uid);
      
      res.status(200).json({
        success: true,
        data: {
          userId: uid,
          token,
          expiresIn: 3600, // 1 hour
        } as AuthResponse,
      });
    } catch (error) {
      next(new ApiError('Authentication failed', 401));
    }
  },
};

export default authController;
