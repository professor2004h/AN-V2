import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import trainerRoutes from './routes/trainer';
import adminRoutes from './routes/admin';
import superadminRoutes from './routes/superadmin';
import projectRoutes from './routes/project';
import submissionRoutes from './routes/submission';
import taskRoutes from './routes/task';
import paymentRoutes from './routes/payment';
import notificationRoutes from './routes/notification';
import messageRoutes from './routes/message';
import workspaceRoutes from './routes/workspace';
import analyticsRoutes from './routes/analytics';
import setupRoutes from './routes/setup';
import proxyRoutes, { wsProxy } from './routes/proxy';
import { workspaceService } from './services/workspaceService';

const app = express();

// Trust proxy (required for ALB and rate limiting)
app.set('trust proxy', 1);

// Security middleware - disable CSP for proxy routes (code-server has its own security)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/proxy')) {
    // Skip helmet for proxy routes to avoid CSP conflicts with code-server
    return next();
  }
  helmet()(req, res, next);
});
// CORS configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://ecombinators.com',
  'https://ecombinators.com',
  'http://www.ecombinators.com',
  'https://www.ecombinators.com',
  'http://localhost:3000',
  'http://apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked origin for debugging
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Proxy routes (must be before body parsing)
app.use('/api/proxy', proxyRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/setup', setupRoutes); // One-time setup endpoint
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Apranova LMS Backend running on port ${config.port}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);

  // Schedule workspace cleanup every minute
  setInterval(() => {
    workspaceService.cleanupWorkspaces();
  }, 60 * 1000);
});

// Attach WebSocket upgrade handler for workspace proxy
// This handles WebSocket connections at the server level before Express
server.on('upgrade', (req, socket, head) => {
  // Only handle workspace proxy WebSocket requests
  if (req.url && req.url.includes('/api/proxy/workspace/')) {
    logger.info('WebSocket upgrade request', { url: req.url });
    wsProxy.upgrade(req, socket as any, head);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;

