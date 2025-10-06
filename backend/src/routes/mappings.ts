import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/kct/mappings - List mappings
router.get('/', [
  authenticate,
  query('framework_id').optional().isInt(),
  query('version_id').optional().isInt(),
  query('target_type').optional().isIn(['course_template', 'class_instance']),
  query('campus_id').optional().isInt(),
  query('status').optional().isIn(['planned', 'validated', 'applied', 'failed', 'rolled_back']),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const {
    framework_id,
    version_id,
    target_type,
    campus_id,
    status,
    page = 1,
    page_size = 20
  } = req.query;

  const user = req.user!;
  const offset = (Number(page) - 1) * Number(page_size);

  // Build WHERE clause - join with curriculum_frameworks to get tenant access
  let whereConditions = ['cf.tenant_id = ?'];
  let params: any[] = [user.tenantId];

  if (framework_id) {
    whereConditions.push('km.framework_id = ?');
    params.push(framework_id);
  }

  if (version_id) {
    whereConditions.push('km.version_id = ?');
    params.push(version_id);
  }

  if (target_type) {
    whereConditions.push('km.target_type = ?');
    params.push(target_type);
  }

  if (campus_id) {
    whereConditions.push('km.campus_id = ?');
    params.push(campus_id);
  }

  if (status) {
    whereConditions.push('km.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total FROM kct_mappings km
    INNER JOIN curriculum_frameworks cf ON km.framework_id = cf.id
    WHERE ${whereClause}
  `;
  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  // Get mappings with related data
  const mappingsQuery = `
    SELECT km.*,
            cf.name as framework_name,
            cfv.version_no,
            c.name as campus_name,
            u.full_name as created_by_name,
            uu.full_name as updated_by_name
    FROM kct_mappings km
    INNER JOIN curriculum_frameworks cf ON km.framework_id = cf.id
    INNER JOIN curriculum_framework_versions cfv ON km.version_id = cfv.id
    LEFT JOIN campuses c ON km.campus_id = c.id
    LEFT JOIN users u ON km.created_by = u.id
    LEFT JOIN users uu ON km.updated_by = uu.id
    WHERE cf.tenant_id = ?
    ORDER BY km.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Build final query with LIMIT/OFFSET as literals to avoid prepared statement issues
  const finalQuery = mappingsQuery.replace('LIMIT ? OFFSET ?', `LIMIT ${Number(page_size)} OFFSET ${offset}`);
  const [mappings] = await config.query(finalQuery, params);

  // Parse JSON fields
  mappings.forEach((mapping: any) => {
    if (mapping.mismatch_report) {
      mapping.mismatch_report = JSON.parse(mapping.mismatch_report);
    }
  });

  res.json({
    data: mappings,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// POST /api/v1/kct/mappings - Create mapping
router.post('/', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  body('framework_id').isInt(),
  body('version_id').isInt(),
  body('target_type').isIn(['course_template', 'class_instance']),
  body('target_id').isInt(),
  body('campus_id').optional().isInt(),
  body('rollout_batch').optional().isLength({ max: 64 }),
  body('rollout_phase').optional().isIn(['planned', 'pilot', 'phased', 'full']),
  body('mismatch_report').optional(),
  body('risk_assessment').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('override_reason').optional().isLength({ max: 2000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const {
    framework_id,
    version_id,
    target_type,
    target_id,
    campus_id,
    rollout_batch,
    rollout_phase = 'planned',
    mismatch_report,
    risk_assessment = 'low',
    override_reason
  } = req.body;

  // Verify framework and version belong to user's tenant
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cfv.framework_id = ? AND cf.tenant_id = ?`,
    [version_id, framework_id, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Framework or version not found', 'NOT_FOUND', 404);
  }

  // Verify campus belongs to tenant (if provided)
  if (campus_id) {
    const [campuses] = await config.query(
      'SELECT id FROM campuses WHERE id = ? AND tenant_id = ?',
      [campus_id, user.tenantId]
    );

    if (campuses.length === 0) {
      throw createError('Invalid campus', 'INVALID_CAMPUS', 400);
    }
  }

  // Check for duplicate mapping
  const [existing] = await config.query(
    'SELECT id FROM kct_mappings WHERE framework_id = ? AND version_id = ? AND target_type = ? AND target_id = ? AND campus_id IS NOT DISTINCT FROM ?',
    [framework_id, version_id, target_type, target_id, campus_id]
  );

  if (existing.length > 0) {
    throw createError('Mapping already exists', 'DUPLICATE_MAPPING', 409);
  }

  const [result] = await config.query(
    `INSERT INTO kct_mappings (
      framework_id, version_id, target_type, target_id, campus_id,
      rollout_batch, rollout_phase, mismatch_report, risk_assessment, override_reason,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      framework_id,
      version_id,
      target_type,
      target_id,
      campus_id || null,
      rollout_batch || null,
      rollout_phase,
      mismatch_report ? JSON.stringify(mismatch_report) : null,
      risk_assessment,
      override_reason || null,
      user.id,
      user.id
    ]
  );

  const mappingId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'kct_mapping', mappingId.toString(), {
    framework_id,
    version_id,
    target_type,
    target_id
  });

  res.status(201).json({
    id: mappingId,
    framework_id,
    version_id,
    target_type,
    target_id,
    campus_id,
    rollout_batch,
    rollout_phase,
    mismatch_report,
    risk_assessment,
    override_reason,
    status: 'planned',
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/kct/mappings/{id} - Update mapping
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('rollout_phase').optional().isIn(['planned', 'pilot', 'phased', 'full']),
  body('mismatch_report').optional(),
  body('risk_assessment').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('override_reason').optional().isLength({ max: 2000 }),
  body('status').optional().isIn(['planned', 'validated', 'applied', 'failed', 'rolled_back'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify mapping exists and belongs to user's tenant
  const [mappings] = await config.query(
    'SELECT tenant_id FROM kct_mappings WHERE id = ? AND tenant_id = ?',
    [id, user.tenantId]
  );

  if (mappings.length === 0) {
    throw createError('Mapping not found', 'NOT_FOUND', 404);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === 'mismatch_report') {
        updateFields.push(`${key} = ?`);
        params.push(JSON.stringify(updates[key]));
      } else if (key === 'status' && updates[key] === 'applied') {
        updateFields.push(`${key} = ?, applied_at = NOW()`);
        params.push(updates[key]);
      } else if (key === 'status' && updates[key] === 'rolled_back') {
        updateFields.push(`${key} = ?, rolled_back_at = NOW()`);
        params.push(updates[key]);
      } else {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }
  });

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_by = ?, updated_at = NOW()');
  params.push(user.id, id);

  await config.query(
    `UPDATE kct_mappings SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'kct_mapping', id, updates);

  res.json({ message: 'Mapping updated successfully' });
}));

// DELETE /api/v1/kct/mappings/{id} - Delete mapping
router.delete('/:id', [
  authenticate,
  authorize('program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify mapping exists and belongs to user's tenant
  const [mappings] = await config.query(
    'SELECT tenant_id, status FROM kct_mappings WHERE id = ? AND tenant_id = ?',
    [id, user.tenantId]
  );

  if (mappings.length === 0) {
    throw createError('Mapping not found', 'NOT_FOUND', 404);
  }

  const mapping = mappings[0];

  // Cannot delete applied mappings
  if (mapping.status === 'applied') {
    throw createError('Cannot delete applied mapping', 'CANNOT_DELETE_APPLIED', 403);
  }

  await config.query(
    'DELETE FROM kct_mappings WHERE id = ?',
    [id]
  );

  auditLogger.update(user.id.toString(), 'kct_mapping', id, { deleted: true });

  res.json({ message: 'Mapping deleted successfully' });
}));

export default router;