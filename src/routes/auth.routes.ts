import { Router } from 'express';
import authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/auth/anonymous
 * @desc    Create anonymous user
 * @access  Public
 */
router.post('/anonymous', authController.createAnonymousUser);

/**
 * @route   POST /api/auth/token
 * @desc    Sign in with token
 * @access  Public
 */
router.post('/token', authController.signInWithToken);

export default router;
