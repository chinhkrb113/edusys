import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeQueues } from './services/queueService';

// Import routes
import authRoutes from './routes/auth';
import curriculumRoutes from './routes/curriculum';
import versionRoutes from './routes/versions';
import courseRoutes from './routes/courses';
import unitRoutes from './routes/units';
import resourceRoutes from './routes/resources';
import mappingRoutes from './routes/mappings';
import exportRoutes from './routes/exports';
import reportRoutes from './routes/reports';
import commentRoutes from './routes/comments';
import tagRoutes from './routes/tags';
import approvalRoutes from './routes/approvals';
import savedViewRoutes from './routes/savedViews';
import assignmentRoutes from './routes/assignments';
import gameRoutes from './routes/games';
import aiRoutes from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite default
      'http://localhost:8080', // Alternative port
      'http://localhost:3000', // Common dev port
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// TEST ROUTE WITHOUT AUTH (for development testing only)
app.get('/api/v1/test/kct-data', async (req, res) => {
  try {
    console.log('🔍 TEST API: Getting curriculum frameworks without auth');

    // Import database config
    const { config } = await import('./config/database');

    const frameworksQuery = `
      SELECT
        cf.id,
        cf.code,
        cf.name,
        cf.language,
        cf.total_hours,
        cf.total_sessions,
        cf.session_duration_hours,
        cf.learning_method,
        cf.learning_format,
        cf.status,
        cf.owner_user_id,
        cf.updated_at,
        cf.target_level,
        cf.age_group,
        cf.description
      FROM curriculum_frameworks cf
      WHERE cf.tenant_id = ? AND cf.deleted_at IS NULL
      ORDER BY cf.updated_at DESC
      LIMIT 10
    `;

    const [frameworks] = await config.query(frameworksQuery, [1]);

    console.log(`✅ Test API returning ${frameworks.length} frameworks`);

    res.json({
      success: true,
      data: frameworks,
      count: frameworks.length,
      message: '✅ API working! Data retrieved from database successfully.',
      timestamp: new Date().toISOString(),
      endpoint: '/api/v1/test/kct-data',
      auth: 'none'
    });
  } catch (error: unknown) {
    console.error('❌ Test API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ API test failed'
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/kct', curriculumRoutes);
app.use('/api/v1/kct', versionRoutes); // Mount version routes under /kct for framework-specific endpoints
app.use('/api/v1/versions', versionRoutes); // Also mount under /versions for direct version access
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/mappings', mappingRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/saved-views', savedViewRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Environment variables loaded successfully

    // Skip database connection test in development if SKIP_DB_TEST is set
    if (process.env.SKIP_DB_TEST !== 'true') {
      await config.testConnection();
      logger.info('Database connection established');
    } else {
      logger.warn('Skipping database connection test (SKIP_DB_TEST=true)');
    }

    // Initialize background queues (skip if database not available)
    try {
      await initializeQueues();
      logger.info('Background queues initialized');
    } catch (queueError) {
      logger.warn('Failed to initialize queues, continuing without them:', queueError);
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API available at: http://localhost:${PORT}/api/v1/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
