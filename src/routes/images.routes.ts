import { Router } from 'express';
import { imagesController } from '../controllers/images.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser as any);

// Route for analyzing images
router.post('/analyze', imagesController.analyzeImage);

// Route for generating images
router.post('/generate', imagesController.generateImage);

export default router;
