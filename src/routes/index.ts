import { Router } from 'express';
import authRoutes from './auth.routes';
import savesRoutes from './saves.routes';
import eventsRoutes from './events.routes';
import postsRoutes from './posts.routes';
import imagesRoutes from './images.routes';
import testRoutes from './test.routes';
import healthRoutes from './health.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Saves routes
router.use('/saves', savesRoutes);

// Events routes (nested under saves)
router.use('/saves/:saveId/events', eventsRoutes);

// Posts routes (nested under saves)
router.use('/saves/:saveId/posts', postsRoutes);

// Images routes for generating graphics
router.use('/images', imagesRoutes);

// Test routes for connectivity testing
router.use('/test', testRoutes);

// Health check route
router.use('/health', healthRoutes);

export default router;
