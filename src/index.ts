import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000; // Changed to port 3000 to avoid conflict with macOS Control Center

// Middleware
app.use(helmet({
  // Disable content security policy for development
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
})); // Security headers

// Configure CORS to be more permissive during development
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// Increase JSON body size limit to 10MB to handle base64 encoded images
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging

// Add request logging middleware for debugging TestFlight issues
app.use((req, res, next) => {
  console.log(`[BACKEND] 📩 ${req.method} ${req.originalUrl}`);
  console.log(`[BACKEND] Headers:`, JSON.stringify(req.headers));
  console.log(`[BACKEND] Query params:`, req.query);
  console.log(`[BACKEND] Body size:`, req.body ? JSON.stringify(req.body).length : 0);
  
  // Track response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[BACKEND] 📤 Response status:`, res.statusCode);
    return originalSend.call(this, body);
  };
  
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'StatStory API',
    version: '1.0.0',
    status: 'running',
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});
