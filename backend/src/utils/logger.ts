import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      )
    }),

    // File transport for production
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Audit log for security events
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export { logger };

// Helper functions for different log levels
export const auditLogger = {
  login: (userId: string, ip: string, userAgent: string) => {
    logger.info('User login', {
      action: 'LOGIN',
      userId,
      ip,
      userAgent,
      category: 'AUTHENTICATION'
    });
  },

  logout: (userId: string) => {
    logger.info('User logout', {
      action: 'LOGOUT',
      userId,
      category: 'AUTHENTICATION'
    });
  },

  create: (userId: string, entityType: string, entityId: string, details?: any) => {
    logger.info('Entity created', {
      action: 'CREATE',
      actorId: userId,
      entityType,
      entityId,
      details,
      category: 'DATA_MODIFICATION'
    });
  },

  update: (userId: string, entityType: string, entityId: string, changes?: any) => {
    logger.info('Entity updated', {
      action: 'UPDATE',
      actorId: userId,
      entityType,
      entityId,
      changes,
      category: 'DATA_MODIFICATION'
    });
  },

  delete: (userId: string, entityType: string, entityId: string) => {
    logger.info('Entity deleted', {
      action: 'DELETE',
      actorId: userId,
      entityType,
      entityId,
      category: 'DATA_MODIFICATION'
    });
  },

  publish: (userId: string, entityType: string, entityId: string) => {
    logger.info('Entity published', {
      action: 'PUBLISH',
      actorId: userId,
      entityType,
      entityId,
      category: 'WORKFLOW'
    });
  },

  export: (userId: string, entityType: string, entityId: string, format: string) => {
    logger.info('Entity exported', {
      action: 'EXPORT',
      actorId: userId,
      entityType,
      entityId,
      format,
      category: 'DATA_ACCESS'
    });
  }
};