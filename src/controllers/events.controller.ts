import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { ApiError } from '../middleware/error';
import { CreateEventRequest, Event } from '../types';

/**
 * Controller for event-related operations
 */
export const eventsController = {
  /**
   * Get all events for a save
   */
  getEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Get events
      const snapshot = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .orderBy('createdAt', 'desc')
        .get();
      
      const events: Event[] = [];
      
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        } as Event);
      });
      
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(new ApiError('Failed to get events', 500));
    }
  },
  
  /**
   * Get a single event by ID
   */
  getEventById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, eventId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Get event
      const eventDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .get();
      
      if (!eventDoc.exists) {
        return next(new ApiError('Event not found', 404));
      }
      
      const event = {
        id: eventDoc.id,
        ...eventDoc.data()
      } as Event;
      
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(new ApiError('Failed to get event', 500));
    }
  },
  
  /**
   * Create a new event
   */
  createEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Starting event creation process...');

      if (!req.user) {
        console.log('No user found in request');
        return next(new ApiError('Unauthorized', 401));
      }
      
      console.log('User authenticated:', req.user.uid);
      
      const { saveId } = req.params;
      console.log('Save ID from params:', saveId);
      
      console.log('Request body:', JSON.stringify(req.body));
      const { title, description, type, imageURL } = req.body as CreateEventRequest;
      
      if (!description || !type) {
        console.log('Missing required fields:', { description, type });
        return next(new ApiError('Description and type are required', 400));
      }
      
      // Check if save exists and belongs to the user
      console.log('Checking if save exists and belongs to the user...');
      
      let saveDoc;
      try {
        saveDoc = await db.collection('saves').doc(saveId).get();
      } catch (saveError) {
        console.error('Error fetching save document:', saveError);
        return next(new ApiError(`Failed to fetch save document: ${saveError}`, 500));
      }
      
      if (!saveDoc.exists) {
        console.log('Save not found');
        return next(new ApiError('Save not found', 404));
      }
      
      const saveData = saveDoc.data();
      console.log('Save data:', saveData);
      
      if (saveData?.userId !== req.user.uid) {
        console.log('Save does not belong to user. Save userId:', saveData?.userId, 'Request userId:', req.user.uid);
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Create event with proper field sanitization
      const eventData = {
        saveId,
        title: title || "", // Default to empty string instead of null
        description: description.trim(), // Trim whitespace
        type: type.toLowerCase().trim(), // Normalize type to lowercase
        imageURL: imageURL || "", // Default to empty string instead of null
        eventDate: req.body.eventDate || new Date().toISOString(), // Use provided fictional date or default to now
        createdAt: new Date().toISOString(),
        userId: req.user.uid // Always include the userId
      };
      
      // Additional validation logs
      console.log('Sanitized event data for Firestore:', JSON.stringify(eventData));
      
      // Log the data being stored
      console.log('Creating event with data:', JSON.stringify(eventData));
      
      const eventRef = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .add(eventData);
      
      const eventDoc = await eventRef.get();
      
      const event = {
        id: eventDoc.id,
        ...eventDoc.data()
      } as Event;
      
      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      console.error('Error details:', error);
      
      // Check error type and provide more detailed information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Additional Firebase-specific error handling
      if (error && typeof error === 'object' && 'code' in error) {
        console.error(`Firebase error code: ${(error as any).code}`);
      }
      
      next(new ApiError(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
    }
  },
  
  /**
   * Update an event
   */
  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, eventId } = req.params;
      const { title, description, type, imageURL } = req.body;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Check if event exists
      const eventDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .get();
      
      if (!eventDoc.exists) {
        return next(new ApiError('Event not found', 404));
      }
      
      // Update event
      const updateData: Partial<Event> = {};
      
      if (title !== undefined) updateData.title = title;
      if (description) updateData.description = description;
      if (type) updateData.type = type;
      if (imageURL !== undefined) updateData.imageURL = imageURL;
      
      await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .update(updateData);
      
      // Get updated event
      const updatedEventDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .get();
      
      const updatedEvent = {
        id: updatedEventDoc.id,
        ...updatedEventDoc.data()
      } as Event;
      
      res.status(200).json({
        success: true,
        data: updatedEvent,
      });
    } catch (error) {
      next(new ApiError('Failed to update event', 500));
    }
  },
  
  /**
   * Delete an event
   */
  deleteEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, eventId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Check if event exists
      const eventDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .get();
      
      if (!eventDoc.exists) {
        return next(new ApiError('Event not found', 404));
      }
      
      // Delete event
      await db
        .collection('saves')
        .doc(saveId)
        .collection('events')
        .doc(eventId)
        .delete();
      
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(new ApiError('Failed to delete event', 500));
    }
  },
};

export default eventsController;
