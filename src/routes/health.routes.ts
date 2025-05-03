import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * Health check controller
 */
export const healthController = {
  /**
   * @route   GET /api/health
   * @desc    Health check endpoint
   * @access  Public
   */
  getHealth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get server uptime in seconds
      const uptime = Math.floor(process.uptime());
      
      // Format uptime as days, hours, minutes, seconds
      const days = Math.floor(uptime / (24 * 60 * 60));
      const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((uptime % (60 * 60)) / 60);
      const seconds = Math.floor(uptime % 60);
      
      // Format uptime string
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      
      // Return health status
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          uptime: uptimeStr,
          version: process.env.npm_package_version || '1.0.0',
        },
        message: 'Server is running'
      });
    } catch (error) {
      console.error('Health check error:', error);
      next(error);
    }
  }
};

// Route for health check
router.get('/', healthController.getHealth);

export default router;
