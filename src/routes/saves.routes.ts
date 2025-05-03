import { Router } from 'express';
import savesController from '../controllers/saves.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser as any);

/**
 * @route   GET /api/saves
 * @desc    Get all saves for a user
 * @access  Private
 */
router.get('/', savesController.getSaves);

/**
 * @route   GET /api/saves/:saveId
 * @desc    Get a single save by ID
 * @access  Private
 */
router.get('/:saveId', savesController.getSaveById);

/**
 * @route   POST /api/saves
 * @desc    Create a new save
 * @access  Private
 */
router.post('/', savesController.createSave);

/**
 * @route   PUT /api/saves/:saveId
 * @desc    Update a save
 * @access  Private
 */
router.put('/:saveId', savesController.updateSave);

/**
 * @route   DELETE /api/saves/:saveId
 * @desc    Delete a save
 * @access  Private
 */
router.delete('/:saveId', savesController.deleteSave);

export default router;
