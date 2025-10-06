import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/saved-views - List user's saved views
router.get('/', [
  authenticate,
  query('entity_type').optional().isIn(['curriculum_overview', 'course_management', 'unit_management', 'resource_library', 'reports']),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { entity_type, page = 1, page_size = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(page_size);

  let whereConditions = ['sv.user_id = ? AND sv.tenant_id = ?'];
  let params: any[] = [user.id, user.tenantId];

  if (entity_type) {
    whereConditions.push('sv.entity_type = ?');
    params.push(entity_type);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM saved_views sv WHERE ${whereClause}`;
  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  // Get saved views
  const viewsQuery = `
    SELECT sv.*, COUNT(svr.id) as usage_count
    FROM saved_views sv
    LEFT JOIN saved_view_recent svr ON sv.id = svr.saved_view_id
    WHERE ${whereClause}
    GROUP BY sv.id
    ORDER BY sv.last_used_at DESC, sv.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const finalParams = [...params, Number(page_size), offset];
  const [views] = await config.query(viewsQuery, finalParams);

  // Parse filters JSON
  views.forEach((view: any) => {
    if (view.filters) {
      view.filters = JSON.parse(view.filters);
    }
  });

  res.json({
    data: views,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// POST /api/v1/saved-views - Create saved view
router.post('/', [
  authenticate,
  body('name').isLength({ min: 1, max: 100 }),
  body('entity_type').isIn(['curriculum_overview', 'course_management', 'unit_management', 'resource_library', 'reports']),
  body('filters').isObject(),
  body('description').optional().isLength({ max: 500 }),
  body('is_public').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const { name, entity_type, filters, description, is_public = false } = req.body;

  // Check for duplicate name for this user and entity type
  const [existing] = await config.query(
    'SELECT id FROM saved_views WHERE user_id = ? AND entity_type = ? AND name = ? AND tenant_id = ?',
    [user.id, entity_type, name, user.tenantId]
  );

  if (existing.length > 0) {
    throw createError('Saved view name already exists for this entity type', 'DUPLICATE_NAME', 409);
  }

  const [result] = await config.query(
    `INSERT INTO saved_views (
      tenant_id, user_id, name, entity_type, filters, description, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.tenantId,
      user.id,
      name,
      entity_type,
      JSON.stringify(filters),
      description || null,
      is_public
    ]
  );

  const viewId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'saved_view', viewId.toString(), {
    name,
    entity_type
  });

  res.status(201).json({
    id: viewId,
    name,
    entity_type,
    filters,
    description,
    is_public,
    usage_count: 0,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/saved-views/{id} - Update saved view
router.patch('/:id', [
  authenticate,
  param('id').isInt(),
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('filters').optional().isObject(),
  body('description').optional().isLength({ max: 500 }),
  body('is_public').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify ownership
  const [views] = await config.query(
    'SELECT user_id FROM saved_views WHERE id = ? AND tenant_id = ?',
    [id, user.tenantId]
  );

  if (views.length === 0) {
    throw createError('Saved view not found', 'NOT_FOUND', 404);
  }

  const view = views[0];

  if (view.user_id !== user.id && user.role !== 'admin') {
    throw createError('Cannot modify saved view created by another user', 'FORBIDDEN', 403);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === 'filters') {
        updateFields.push('filters = ?');
        params.push(JSON.stringify(updates[key]));
      } else {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }
  });

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_at = NOW()');
  params.push(id);

  await config.query(
    `UPDATE saved_views SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'saved_view', id, updates);

  res.json({ message: 'Saved view updated successfully' });
}));

// DELETE /api/v1/saved-views/{id} - Delete saved view
router.delete('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify ownership
  const [views] = await config.query(
    'SELECT user_id FROM saved_views WHERE id = ? AND tenant_id = ?',
    [id, user.tenantId]
  );

  if (views.length === 0) {
    throw createError('Saved view not found', 'NOT_FOUND', 404);
  }

  const view = views[0];

  if (view.user_id !== user.id && user.role !== 'admin') {
    throw createError('Cannot delete saved view created by another user', 'FORBIDDEN', 403);
  }

  // Soft delete
  await config.query(
    'UPDATE saved_views SET deleted_at = NOW() WHERE id = ?',
    [id]
  );

  auditLogger.update(user.id.toString(), 'saved_view', id, { deleted: true });

  res.json({ message: 'Saved view deleted successfully' });
}));

// POST /api/v1/saved-views/{id}/use - Record view usage
router.post('/:id/use', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify view exists and is accessible
  const [views] = await config.query(
    `SELECT id, user_id, is_public FROM saved_views
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if (views.length === 0) {
    throw createError('Saved view not found', 'NOT_FOUND', 404);
  }

  const view = views[0];

  // Check access (owner or public)
  if (view.user_id !== user.id && !view.is_public) {
    throw createError('Access denied to this saved view', 'FORBIDDEN', 403);
  }

  // Record usage
  await config.query(
    `INSERT INTO saved_view_recent (saved_view_id, user_id, used_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE used_at = NOW()`,
    [id, user.id]
  );

  // Update last_used_at
  await config.query(
    'UPDATE saved_views SET last_used_at = NOW() WHERE id = ?',
    [id]
  );

  res.json({ message: 'View usage recorded' });
}));

// GET /api/v1/saved-views/public - Get public saved views
router.get('/public', [
  authenticate,
  query('entity_type').optional().isIn(['curriculum_overview', 'course_management', 'unit_management', 'resource_library', 'reports']),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { entity_type, page = 1, page_size = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(page_size);

  let whereConditions = ['sv.tenant_id = ? AND sv.is_public = 1 AND sv.deleted_at IS NULL'];
  let params: any[] = [user.tenantId];

  if (entity_type) {
    whereConditions.push('sv.entity_type = ?');
    params.push(entity_type);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM saved_views sv WHERE ${whereClause}`;
  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  // Get public views
  const viewsQuery = `
    SELECT sv.*, u.full_name as creator_name, COUNT(svr.id) as usage_count
    FROM saved_views sv
    LEFT JOIN users u ON sv.user_id = u.id
    LEFT JOIN saved_view_recent svr ON sv.id = svr.saved_view_id
    WHERE ${whereClause}
    GROUP BY sv.id
    ORDER BY sv.last_used_at DESC, sv.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const finalParams = [...params, Number(page_size), offset];
  const [views] = await config.query(viewsQuery, finalParams);

  // Parse filters JSON
  views.forEach((view: any) => {
    if (view.filters) {
      view.filters = JSON.parse(view.filters);
    }
  });

  res.json({
    data: views,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

export default router;