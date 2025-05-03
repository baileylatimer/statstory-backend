import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { ApiError } from '../middleware/error';
import { CreateSaveRequest, Save } from '../types';

/**
 * Controller for save-related operations
 */
export const savesController = {
  /**
   * Get all saves for a user
   */
  getSaves: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const userId = req.user.uid;
      const sport = req.query.sport as string | undefined;
      
      let savesQuery = db.collection('saves').where('userId', '==', userId);
      
      if (sport && sport !== 'All') {
        savesQuery = savesQuery.where('sport', '==', sport);
      }
      
      const snapshot = await savesQuery.get();
      const saves: Save[] = [];
      
      snapshot.forEach((doc) => {
        saves.push({
          id: doc.id,
          ...doc.data()
        } as Save);
      });
      
      res.status(200).json({
        success: true,
        data: saves,
      });
    } catch (error) {
      next(new ApiError('Failed to get saves', 500));
    }
  },
  
  /**
   * Get a single save by ID
   */
  getSaveById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      const save = {
        id: saveDoc.id,
        ...saveDoc.data()
      } as Save;
      
      // Check if the save belongs to the user
      if (save.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      res.status(200).json({
        success: true,
        data: save,
      });
    } catch (error) {
      next(new ApiError('Failed to get save', 500));
    }
  },
  
  /**
   * Create a new save
   */
  createSave: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { name, sport } = req.body as CreateSaveRequest;
      
      if (!name || !sport) {
        return next(new ApiError('Name and sport are required', 400));
      }
      
      const saveData = {
        userId: req.user.uid,
        name,
        sport,
        createdAt: new Date().toISOString(),
      };
      
      const saveRef = await db.collection('saves').add(saveData);
      const saveDoc = await saveRef.get();
      
      const save = {
        id: saveDoc.id,
        ...saveDoc.data()
      } as Save;
      
      res.status(201).json({
        success: true,
        data: save,
      });
    } catch (error) {
      next(new ApiError('Failed to create save', 500));
    }
  },
  
  /**
   * Update a save
   */
  updateSave: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      const { name, sport } = req.body;
      
      // Check if save exists
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      const save = {
        id: saveDoc.id,
        ...saveDoc.data()
      } as Save;
      
      // Check if the save belongs to the user
      if (save.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Update save
      const updateData: Partial<Save> = {};
      
      if (name) updateData.name = name;
      if (sport) updateData.sport = sport;
      
      await db.collection('saves').doc(saveId).update(updateData);
      
      // Get updated save
      const updatedSaveDoc = await db.collection('saves').doc(saveId).get();
      
      const updatedSave = {
        id: updatedSaveDoc.id,
        ...updatedSaveDoc.data()
      } as Save;
      
      res.status(200).json({
        success: true,
        data: updatedSave,
      });
    } catch (error) {
      next(new ApiError('Failed to update save', 500));
    }
  },
  
  /**
   * Delete a save
   */
  deleteSave: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      
      // Check if save exists
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      const save = {
        id: saveDoc.id,
        ...saveDoc.data()
      } as Save;
      
      // Check if the save belongs to the user
      if (save.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Delete save
      await db.collection('saves').doc(saveId).delete();
      
      res.status(200).json({
        success: true,
        message: 'Save deleted successfully',
      });
    } catch (error) {
      next(new ApiError('Failed to delete save', 500));
    }
  },
};

export default savesController;
