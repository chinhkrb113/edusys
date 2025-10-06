import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger, auditLogger } from '../utils/logger';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    { userId, type: 'access' },
    secret,
    { expiresIn }
  );
};

const generateRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production';

  return jwt.sign(
    { userId, type: 'refresh' },
    secret,
    { expiresIn: '7d' }
  );
};

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { email, password } = req.body;

  // Find user
  const [users] = await config.query(
    `SELECT id, tenant_id, email, full_name, role, campus_id, password_hash, is_active, last_login_at
     FROM users
     WHERE email = ? AND deleted_at IS NULL`,
    [email]
  );

  if (users.length === 0) {
    throw createError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  const user = users[0];

  if (!user.is_active) {
    throw createError('Account is disabled', 'ACCOUNT_DISABLED', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  // Update last login
  await config.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = ?',
    [user.id]
  );

  // Generate tokens
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Log successful login
  auditLogger.login(user.id.toString(), req.ip, req.get('User-Agent') || '');

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 86400, // 24 hours
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      tenant_id: user.tenant_id,
      campus_id: user.campus_id
    }
  });
}));

// POST /api/v1/auth/refresh
router.post('/refresh', [
  body('refresh_token').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { refresh_token } = req.body;

  try {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production';
    const decoded = jwt.verify(refresh_token, secret) as any;

    if (decoded.type !== 'refresh') {
      throw createError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }

    // Verify user still exists
    const [users] = await config.query(
      'SELECT id FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      throw createError('User not found', 'USER_NOT_FOUND', 401);
    }

    // Generate new tokens
    const accessToken = generateToken(decoded.userId);
    const refreshToken = generateRefreshToken(decoded.userId);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400
    });
  } catch (error) {
    throw createError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }
}));

// POST /api/v1/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, just log the logout
  auditLogger.logout(req.user!.id.toString());

  res.json({ message: 'Logged out successfully' });
}));

// GET /api/v1/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [users] = await config.query(
    `SELECT id, tenant_id, email, full_name, role, campus_id, created_at, last_login_at
     FROM users
     WHERE id = ?`,
    [req.user!.id]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  res.json({ user: users[0] });
}));

export default router;