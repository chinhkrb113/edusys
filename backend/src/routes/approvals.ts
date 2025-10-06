import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/versions/{versionId}/approvals - Get approvals for version
router.get('/versions/:versionId/approvals', [
  authenticate,
  param('versionId').isInt()
], asyncHandler(async (req, res) => {
  const { versionId } = req.params;
  const user = req.user!;

  // Verify version belongs to user's tenant
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cf.tenant_id = ?`,
    [versionId, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  // Get approvals for this version
  const [approvals] = await config.query(
    `SELECT a.*,
            u.full_name as requested_by_name,
            r.full_name as reviewer_name,
            d.full_name as decision_made_by_name,
            e.full_name as escalated_to_name
     FROM approvals a
     LEFT JOIN users u ON a.requested_by = u.id
     LEFT JOIN users r ON a.assigned_reviewer_id = r.id
     LEFT JOIN users d ON a.decision_made_by = d.id
     LEFT JOIN users e ON a.escalated_to = e.id
     WHERE a.version_id = ?
     ORDER BY a.created_at DESC`,
    [versionId]
  );

  res.json({ approvals });
}));

// POST /api/v1/versions/{versionId}/approvals - Create approval request
router.post('/versions/:versionId/approvals', [
  authenticate,
  authorize('curriculum_designer', 'program_owner'),
  param('versionId').isInt(),
  body('assigned_reviewer_id').isInt(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('review_deadline').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { versionId } = req.params;
  const user = req.user!;
  const { assigned_reviewer_id, priority = 'normal', review_deadline } = req.body;

  // Verify version belongs to user's tenant
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id, cfv.state
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cf.tenant_id = ?`,
    [versionId, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const version = versions[0];

  // Check if version is in draft state
  if (version.state !== 'draft') {
    throw createError('Can only request approval for draft versions', 'INVALID_STATE', 400);
  }

  // Verify reviewer exists and has appropriate role
  const [reviewers] = await config.query(
    `SELECT id, role FROM users
     WHERE id = ? AND tenant_id = ? AND role IN ('program_owner', 'qa', 'admin') AND is_active = 1`,
    [assigned_reviewer_id, user.tenantId]
  );

  if (reviewers.length === 0) {
    throw createError('Invalid reviewer', 'INVALID_REVIEWER', 400);
  }

  // Check if there's already a pending approval
  const [existing] = await config.query(
    'SELECT id FROM approvals WHERE version_id = ? AND status IN (\'requested\', \'in_review\')',
    [versionId]
  );

  if (existing.length > 0) {
    throw createError('Approval already requested for this version', 'APPROVAL_EXISTS', 409);
  }

  const [result] = await config.query(
    `INSERT INTO approvals (
      tenant_id, version_id, requested_by, assigned_reviewer_id, priority, review_deadline
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.tenantId,
      versionId,
      user.id,
      assigned_reviewer_id,
      priority,
      review_deadline || null
    ]
  );

  const approvalId = (result as any).insertId;

  // Update version state to pending_review
  await config.query(
    'UPDATE curriculum_framework_versions SET state = \'pending_review\', updated_by = ?, updated_at = NOW() WHERE id = ?',
    [user.id, versionId]
  );

  auditLogger.create(user.id.toString(), 'approval', approvalId.toString(), {
    versionId,
    assigned_reviewer_id,
    priority
  });

  res.status(201).json({
    id: approvalId,
    version_id: versionId,
    requested_by: user.id,
    assigned_reviewer_id,
    status: 'requested',
    priority,
    review_deadline,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/approvals/{id} - Update approval (review/approve/reject)
router.patch('/:id', [
  authenticate,
  param('id').isInt(),
  body('status').optional().isIn(['in_review', 'approved', 'rejected', 'escalated']),
  body('decision').optional().isLength({ max: 2000 }),
  body('escalation_reason').optional().isLength({ max: 1000 }),
  body('escalated_to').optional().isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const { status, decision, escalation_reason, escalated_to } = req.body;

  // Verify approval exists and user has access
  const [approvals] = await config.query(
    `SELECT a.*, cf.tenant_id, cfv.id as version_id
     FROM approvals a
     INNER JOIN curriculum_framework_versions cfv ON a.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE a.id = ? AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (approvals.length === 0) {
    throw createError('Approval not found', 'NOT_FOUND', 404);
  }

  const approval = approvals[0];

  // Check permissions
  const canReview = user.id === approval.assigned_reviewer_id ||
                   user.role === 'admin' ||
                   user.role === 'program_owner';

  if (!canReview) {
    throw createError('Not authorized to review this approval', 'UNAUTHORIZED', 403);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  if (status) {
    updateFields.push('status = ?');
    params.push(status);

    if (status === 'approved' || status === 'rejected') {
      updateFields.push('decision_made_by = ?, decision_made_at = NOW()');
      params.push(user.id, user.id);
    }

    if (status === 'escalated') {
      updateFields.push('escalated_to = ?, escalated_at = NOW()');
      params.push(escalated_to, escalated_to);
    }
  }

  if (decision !== undefined) {
    updateFields.push('decision = ?');
    params.push(decision);
  }

  if (escalation_reason !== undefined) {
    updateFields.push('escalation_reason = ?');
    params.push(escalation_reason);
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_at = NOW()');
  params.push(id);

  await config.query(
    `UPDATE approvals SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  // Update version state based on approval decision
  if (status === 'approved') {
    await config.query(
      'UPDATE curriculum_framework_versions SET state = \'approved\', updated_by = ?, updated_at = NOW() WHERE id = ?',
      [user.id, approval.version_id]
    );
  } else if (status === 'rejected') {
    await config.query(
      'UPDATE curriculum_framework_versions SET state = \'draft\', updated_by = ?, updated_at = NOW() WHERE id = ?',
      [user.id, approval.version_id]
    );
  }

  auditLogger.update(user.id.toString(), 'approval', id, { status, decision });

  res.json({ message: 'Approval updated successfully' });
}));

export default router;