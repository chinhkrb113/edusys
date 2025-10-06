import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/kct/{frameworkId}/versions - Get versions by framework
router.get('/:frameworkId/versions', [
  authenticate,
  param('frameworkId').isInt()
], asyncHandler(async (req, res) => {
  const { frameworkId } = req.params;
  const user = req.user!;

  // Verify framework belongs to user's tenant
  const [frameworks] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [frameworkId, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Framework not found', 'NOT_FOUND', 404);
  }

  // Get versions for this framework
  const [versions] = await config.query(
    `SELECT cfv.*,
            u.full_name as created_by_name,
            uu.full_name as updated_by_name
     FROM curriculum_framework_versions cfv
     LEFT JOIN users u ON cfv.created_by = u.id
     LEFT JOIN users uu ON cfv.updated_by = uu.id
     WHERE cfv.framework_id = ? AND cfv.deleted_at IS NULL
     ORDER BY cfv.created_at DESC`,
    [frameworkId]
  );

  // Parse JSON fields
  versions.forEach((version: any) => {
    if (version.metadata) {
      version.metadata = JSON.parse(version.metadata);
    }
  });

  res.json({ versions });
}));

// POST /api/v1/kct/{frameworkId}/versions - Create new version
router.post('/:frameworkId/versions', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('frameworkId').isInt(),
  body('version_no').matches(/^v\d+\.\d+$/),
  body('changelog').optional().isLength({ max: 2000 }),
  body('metadata').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { frameworkId } = req.params;
  const user = req.user!;
  const { version_no, changelog, metadata } = req.body;

  // Verify framework belongs to user's tenant
  const [frameworks] = await config.query(
    'SELECT id, latest_version_id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [frameworkId, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Framework not found', 'NOT_FOUND', 404);
  }

  // Check for duplicate version number
  const [existing] = await config.query(
    'SELECT id FROM curriculum_framework_versions WHERE framework_id = ? AND version_no = ? AND deleted_at IS NULL',
    [frameworkId, version_no]
  );

  if (existing.length > 0) {
    throw createError('Version number already exists', 'DUPLICATE_VERSION', 409);
  }

  const [result] = await config.query(
    `INSERT INTO curriculum_framework_versions (
      framework_id, version_no, state, changelog, metadata, created_by, updated_by
    ) VALUES (?, ?, 'draft', ?, ?, ?, ?)`,
    [
      frameworkId,
      version_no,
      changelog || null,
      metadata ? JSON.stringify(metadata) : null,
      user.id,
      user.id
    ]
  );

  const versionId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'curriculum_framework_version', versionId.toString(), {
    frameworkId,
    version_no
  });

  res.status(201).json({
    id: versionId,
    framework_id: frameworkId,
    version_no,
    state: 'draft',
    changelog,
    metadata,
    created_at: new Date().toISOString()
  });
}));

// GET /api/v1/versions/{id} - Get version details
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [versions] = await config.query(
    `SELECT cfv.*,
            cf.name as framework_name,
            cf.tenant_id,
            u.full_name as created_by_name,
            uu.full_name as updated_by_name
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     LEFT JOIN users u ON cfv.created_by = u.id
     LEFT JOIN users uu ON cfv.updated_by = uu.id
     WHERE cfv.id = ? AND cfv.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const version = versions[0];

  // Parse JSON fields
  if (version.metadata) {
    version.metadata = JSON.parse(version.metadata);
  }

  res.json(version);
}));

// PATCH /api/v1/versions/{id} - Update version
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('changelog').optional().isLength({ max: 2000 }),
  body('metadata').optional(),
  body('state').optional().isIn(['draft', 'pending_review', 'approved', 'published', 'archived'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify version exists and user has access
  const [versions] = await config.query(
    `SELECT cfv.*, cf.tenant_id
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cfv.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const version = versions[0];

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === 'metadata') {
        updateFields.push(`${key} = ?`);
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

  updateFields.push('updated_by = ?', 'updated_at = NOW()');
  params.push(user.id, id);

  await config.query(
    `UPDATE curriculum_framework_versions SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'curriculum_framework_version', id, updates);

  res.json({ message: 'Version updated successfully' });
}));

// DELETE /api/v1/versions/{id} - Soft delete version
router.delete('/:id', [
  authenticate,
  authorize('program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify version exists and user has access
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cfv.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  // Check if this is the latest version
  const [frameworks] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE latest_version_id = ?',
    [id]
  );

  if (frameworks.length > 0) {
    throw createError('Cannot delete the latest version of a framework', 'CANNOT_DELETE_LATEST', 403);
  }

  await config.query(
    'UPDATE curriculum_framework_versions SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  auditLogger.update(user.id.toString(), 'curriculum_framework_version', id, { deleted: true });

  res.json({ message: 'Version deleted successfully' });
}));

// GET /api/v1/kct/{frameworkId}/versions/history - Get version history
router.get('/:frameworkId/versions/history', [
  authenticate,
  param('frameworkId').isInt()
], asyncHandler(async (req, res) => {
  const { frameworkId } = req.params;
  const user = req.user!;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.page_size) || 20;
  const offset = (page - 1) * pageSize;

  // Verify framework belongs to user's tenant
  const [frameworks] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [frameworkId, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Framework not found', 'NOT_FOUND', 404);
  }

  // Get version history
  const [versions] = await config.query(
    `SELECT cfv.*,
            u.full_name as created_by_name,
            uu.full_name as updated_by_name
     FROM curriculum_framework_versions cfv
     LEFT JOIN users u ON cfv.created_by = u.id
     LEFT JOIN users uu ON cfv.updated_by = uu.id
     WHERE cfv.framework_id = ? AND cfv.deleted_at IS NULL
     ORDER BY cfv.created_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    [frameworkId]
  );

  // Get total count
  const [countResult] = await config.query(
    'SELECT COUNT(*) as total FROM curriculum_framework_versions WHERE framework_id = ? AND deleted_at IS NULL',
    [frameworkId]
  );

  const total = countResult[0].total;

  // Parse JSON fields
  versions.forEach((version: any) => {
    if (version.metadata) {
      version.metadata = JSON.parse(version.metadata);
    }
  });

  res.json({
    data: versions,
    page,
    page_size: pageSize,
    total,
    total_pages: Math.ceil(total / pageSize)
  });
}));

// GET /api/v1/kct/{frameworkId}/versions/stats - Get version statistics
router.get('/:frameworkId/versions/stats', [
  authenticate,
  param('frameworkId').isInt()
], asyncHandler(async (req, res) => {
  const { frameworkId } = req.params;
  const user = req.user!;

  // Verify framework belongs to user's tenant
  const [frameworks] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [frameworkId, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Framework not found', 'NOT_FOUND', 404);
  }

  // Get version statistics
  const [stats] = await config.query(
    `SELECT
       COUNT(*) as total_versions,
       SUM(CASE WHEN state = 'published' THEN 1 ELSE 0 END) as published_versions,
       SUM(CASE WHEN state = 'draft' THEN 1 ELSE 0 END) as draft_versions,
       MAX(CASE WHEN state = 'published' THEN published_at ELSE NULL END) as last_published_at
     FROM curriculum_framework_versions
     WHERE framework_id = ? AND deleted_at IS NULL`,
    [frameworkId]
  );

  res.json(stats[0]);
}));

export default router;