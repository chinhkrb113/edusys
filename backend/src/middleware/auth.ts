import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/database';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: number;
  tenantId: number;
  email: string;
  fullName: string;
  role: string;
  campusId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for testing
    if (process.env.SKIP_AUTH === 'true') {
      // Mock user for testing
      req.user = {
        id: 1,
        tenantId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'admin'
      };
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Authentication token required', 'MISSING_TOKEN', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    const decoded = jwt.verify(token, secret) as any;

    // Verify user still exists and is active
    const [users] = await config.query(
      'SELECT id, tenant_id, email, full_name, role, campus_id, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      throw createError('User not found or inactive', 'USER_NOT_FOUND', 401);
    }

    const user = users[0];
    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      campusId: user.campus_id
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid authentication token', 'INVALID_TOKEN', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Authentication token has expired', 'TOKEN_EXPIRED', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 'NO_AUTH', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        resource: req.path
      });

      next(createError(
        'Insufficient permissions for this action',
        'INSUFFICIENT_PERMISSIONS',
        403
      ));
      return;
    }

    next();
  };
};

export const requireTenantAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(createError('Authentication required', 'NO_AUTH', 401));
    return;
  }

  // Extract tenant ID from URL params or body
  const tenantId = req.params.tenantId || req.body.tenant_id || req.query.tenant_id;

  if (tenantId && parseInt(tenantId) !== req.user.tenantId) {
    next(createError(
      'Access denied to this tenant',
      'TENANT_ACCESS_DENIED',
      403
    ));
    return;
  }

  next();
};

export const requireOwnership = (fieldName: string = 'created_by') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(createError('Authentication required', 'NO_AUTH', 401));
      return;
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      next(createError('Resource ID required', 'MISSING_RESOURCE_ID', 400));
      return;
    }

    try {
      // Check if user owns the resource
      const [resources] = await config.query(
        `SELECT ${fieldName} as owner_id FROM curriculum_frameworks WHERE id = ?`,
        [resourceId]
      );

      if (resources.length === 0) {
        next(createError('Resource not found', 'RESOURCE_NOT_FOUND', 404));
        return;
      }

      const resource = resources[0];
      if (resource.owner_id !== req.user.id && req.user.role !== 'admin') {
        next(createError(
          'You do not own this resource',
          'OWNERSHIP_REQUIRED',
          403
        ));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};