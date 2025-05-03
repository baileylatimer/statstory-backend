import { Router, Request, Response } from 'express';

const router = Router();

// Simple ping endpoint to test API connectivity
router.get('/ping', (req: Request, res: Response) => {
  console.log('Received ping request from:', req.ip);
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
    headers: req.headers
  });
});

export default router;
