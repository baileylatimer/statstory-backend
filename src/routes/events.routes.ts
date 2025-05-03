import { Router } from 'express';
import eventsController from '../controllers/events.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(authenticateUser as any);

/**
 * @route   GET /api/saves/:saveId/events
 * @desc    Get all events for a save
 * @access  Private
 */
router.get('/', eventsController.getEvents);

/**
 * @route   GET /api/saves/:saveId/events/:eventId
 * @desc    Get a single event by ID
 * @access  Private
 */
router.get('/:eventId', eventsController.getEventById);

/**
 * @route   POST /api/saves/:saveId/events
 * @desc    Create a new event
 * @access  Private
 */
router.post('/', eventsController.createEvent);

/**
 * @route   PUT /api/saves/:saveId/events/:eventId
 * @desc    Update an event
 * @access  Private
 */
router.put('/:eventId', eventsController.updateEvent);

/**
 * @route   DELETE /api/saves/:saveId/events/:eventId
 * @desc    Delete an event
 * @access  Private
 */
router.delete('/:eventId', eventsController.deleteEvent);

export default router;
