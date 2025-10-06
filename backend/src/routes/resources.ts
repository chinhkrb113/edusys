import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/units/{unitId}/resources - Get resources by unit
router.get('/units/:unitId/resources', [
  authenticate,
  param('unitId').isInt()
], asyncHandler(async (req, res) => {
  const { unitId } = req.params;
  const user = req.user!;

  // Verify unit belongs to user's tenant
  const [units] = await config.query(
    `SELECT ub.id, cf.tenant_id
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [unitId, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  // Get resources for this unit
  const [resources] = await config.query(
    `SELECT ur.*,
            u.full_name as created_by_name,
            uu.full_name as updated_by_name
     FROM unit_resources ur
     LEFT JOIN users u ON ur.created_by = u.id
     LEFT JOIN users uu ON ur.updated_by = uu.id
     WHERE ur.unit_id = ? AND ur.deleted_at IS NULL
     ORDER BY ur.order_index ASC, ur.created_at ASC`,
    [unitId]
  );

  // Parse JSON fields
  resources.forEach((resource: any) => {
    if (resource.ai_tags) {
      resource.ai_tags = JSON.parse(resource.ai_tags);
    }
    if (resource.manual_tags) {
      resource.manual_tags = JSON.parse(resource.manual_tags);
    }
    if (resource.accessibility_features) {
      resource.accessibility_features = JSON.parse(resource.accessibility_features);
    }
  });

  res.json({ resources });
}));

// POST /api/v1/units/{unitId}/resources - Create resource
router.post('/units/:unitId/resources', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('unitId').isInt(),
  body('kind').isIn(['pdf','slide','video','audio','link','doc','image','worksheet','interactive']),
  body('title').isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 2000 }),
  body('url').optional(),
  body('file_path').optional(),
  body('mime_type').optional(),
  body('license_type').optional(),
  body('license_note').optional(),
  body('order_index').optional().isInt({ min: 0 }),
  body('is_required').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { unitId } = req.params;
  const user = req.user!;
  const {
    kind,
    title,
    description,
    url,
    file_path,
    mime_type,
    license_type,
    license_note,
    order_index = 0,
    is_required = false
  } = req.body;

  // Verify unit belongs to user's tenant and version is not frozen
  const [units] = await config.query(
    `SELECT ub.id, cfv.state, cf.tenant_id
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [unitId, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  const unit = units[0];

  // Check if version is frozen
  if (unit.state && ['pending_review', 'approved', 'published'].includes(unit.state)) {
    throw createError('Cannot add resources to approved or published version', 'VERSION_FROZEN', 403);
  }

  const [result] = await config.query(
    `INSERT INTO unit_resources (
      unit_id, kind, title, description, url, file_path, mime_type,
      license_type, license_note, order_index, is_required,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      unitId,
      kind,
      title,
      description || null,
      url || null,
      file_path || null,
      mime_type || null,
      license_type || null,
      license_note || null,
      order_index,
      is_required,
      user.id,
      user.id
    ]
  );

  const resourceId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'unit_resource', resourceId.toString(), {
    unitId,
    kind,
    title
  });

  res.status(201).json({
    id: resourceId,
    unit_id: unitId,
    kind,
    title,
    description,
    url,
    file_path,
    mime_type,
    license_type,
    license_note,
    order_index,
    is_required,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/resources/{id} - Update resource
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 2000 }),
  body('url').optional(),
  body('file_path').optional(),
  body('mime_type').optional(),
  body('license_type').optional(),
  body('license_note').optional(),
  body('order_index').optional().isInt({ min: 0 }),
  body('is_required').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify resource exists and user has access
  const [resources] = await config.query(
    `SELECT ur.*, cfv.state, cf.tenant_id
     FROM unit_resources ur
     INNER JOIN unit_blueprints ub ON ur.unit_id = ub.id
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ur.id = ? AND ur.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (resources.length === 0) {
    throw createError('Resource not found', 'NOT_FOUND', 404);
  }

  const resource = resources[0];

  // Check if version is frozen
  if (resource.state && ['pending_review', 'approved', 'published'].includes(resource.state)) {
    throw createError('Cannot modify resources in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      params.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_by = ?', 'updated_at = NOW()');
  params.push(user.id, id);

  await config.query(
    `UPDATE unit_resources SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'unit_resource', id, updates);

  res.json({ message: 'Resource updated successfully' });
}));

// DELETE /api/v1/resources/{id} - Delete resource
router.delete('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify resource exists and user has access
  const [resources] = await config.query(
    `SELECT ur.*, cfv.state, cf.tenant_id
     FROM unit_resources ur
     INNER JOIN unit_blueprints ub ON ur.unit_id = ub.id
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ur.id = ? AND ur.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (resources.length === 0) {
    throw createError('Resource not found', 'NOT_FOUND', 404);
  }

  const resource = resources[0];

  // Check if version is frozen
  if (resource.state && ['pending_review', 'approved', 'published'].includes(resource.state)) {
    throw createError('Cannot delete resources from approved or published version', 'VERSION_FROZEN', 403);
  }

  await config.query(
    'UPDATE unit_resources SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  auditLogger.update(user.id.toString(), 'unit_resource', id, { deleted: true });

  res.json({ message: 'Resource deleted successfully' });
}));

export default router;