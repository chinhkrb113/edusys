import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/entities/{entityType}/{entityId}/comments - Get comments for entity
router.get('/entities/:entityType/:entityId/comments', [
  authenticate,
  param('entityType').isIn(['framework', 'version', 'course', 'unit', 'resource', 'mapping']),
  param('entityId').isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, page_size = 20 } = req.query;
  const user = req.user!;

  const offset = (Number(page) - 1) * Number(page_size);

  // Verify entity belongs to user's tenant (basic check)
  let tenantCheckQuery = '';
  switch (entityType) {
    case 'framework':
      tenantCheckQuery = 'SELECT tenant_id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ?';
      break;
    case 'version':
      tenantCheckQuery = `SELECT cf.tenant_id FROM curriculum_framework_versions cfv
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE cfv.id = ? AND cf.tenant_id = ?`;
      break;
    case 'course':
      tenantCheckQuery = `SELECT cf.tenant_id FROM course_blueprints cb
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE cb.id = ? AND cf.tenant_id = ?`;
      break;
    case 'unit':
      tenantCheckQuery = `SELECT cf.tenant_id FROM unit_blueprints ub
                          INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE ub.id = ? AND cf.tenant_id = ?`;
      break;
    case 'resource':
      tenantCheckQuery = `SELECT cf.tenant_id FROM unit_resources ur
                          INNER JOIN unit_blueprints ub ON ur.unit_id = ub.id
                          INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE ur.id = ? AND cf.tenant_id = ?`;
      break;
    default:
      throw createError('Invalid entity type', 'INVALID_ENTITY_TYPE', 400);
  }

  const [entities] = await config.query(tenantCheckQuery, [entityId, user.tenantId]);
  if (entities.length === 0) {
    throw createError('Entity not found', 'NOT_FOUND', 404);
  }

  // Get comments with threading
  const commentsQuery = `SELECT c.*,
            u.full_name as author_name,
            r.full_name as resolved_by_name,
            pu.full_name as parent_author_name
     FROM comments c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN users r ON c.resolved_by = r.id
     LEFT JOIN comments pc ON c.parent_id = pc.id
     LEFT JOIN users pu ON pc.author_id = pu.id
     WHERE c.tenant_id = ? AND c.entity_type = ? AND c.entity_id = ? AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC
     LIMIT ${Number(page_size)} OFFSET ${offset}`;

  const [comments] = await config.query(commentsQuery, [user.tenantId, entityType, entityId]);

  // Parse JSON fields
  comments.forEach((comment: any) => {
    if (comment.mentions) {
      comment.mentions = JSON.parse(comment.mentions);
    }
    if (comment.attachments) {
      comment.attachments = JSON.parse(comment.attachments);
    }
  });

  // Get total count
  const [countResult] = await config.query(
    'SELECT COUNT(*) as total FROM comments WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? AND deleted_at IS NULL',
    [user.tenantId, entityType, entityId]
  );

  const total = countResult[0].total;

  res.json({
    comments,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// POST /api/v1/entities/{entityType}/{entityId}/comments - Create comment
router.post('/entities/:entityType/:entityId/comments', [
  authenticate,
  param('entityType').isIn(['framework', 'version', 'course', 'unit', 'resource', 'mapping']),
  param('entityId').isInt(),
  body('body').isLength({ min: 1, max: 2000 }),
  body('parent_id').optional().isInt(),
  body('mentions').optional(),
  body('attachments').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { entityType, entityId } = req.params;
  const user = req.user!;
  const { body, parent_id, mentions, attachments } = req.body;

  // Verify entity belongs to user's tenant (same logic as GET)
  let tenantCheckQuery = '';
  switch (entityType) {
    case 'framework':
      tenantCheckQuery = 'SELECT tenant_id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ?';
      break;
    case 'version':
      tenantCheckQuery = `SELECT cf.tenant_id FROM curriculum_framework_versions cfv
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE cfv.id = ? AND cf.tenant_id = ?`;
      break;
    case 'course':
      tenantCheckQuery = `SELECT cf.tenant_id FROM course_blueprints cb
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE cb.id = ? AND cf.tenant_id = ?`;
      break;
    case 'unit':
      tenantCheckQuery = `SELECT cf.tenant_id FROM unit_blueprints ub
                          INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE ub.id = ? AND cf.tenant_id = ?`;
      break;
    case 'resource':
      tenantCheckQuery = `SELECT cf.tenant_id FROM unit_resources ur
                          INNER JOIN unit_blueprints ub ON ur.unit_id = ub.id
                          INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
                          INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
                          INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
                          WHERE ur.id = ? AND cf.tenant_id = ?`;
      break;
    default:
      throw createError('Invalid entity type', 'INVALID_ENTITY_TYPE', 400);
  }

  const [entities] = await config.query(tenantCheckQuery, [entityId, user.tenantId]);
  if (entities.length === 0) {
    throw createError('Entity not found', 'NOT_FOUND', 404);
  }

  // If replying to a comment, verify parent comment exists
  if (parent_id) {
    const [parentComments] = await config.query(
      'SELECT id FROM comments WHERE id = ? AND tenant_id = ? AND entity_type = ? AND entity_id = ? AND deleted_at IS NULL',
      [parent_id, user.tenantId, entityType, entityId]
    );

    if (parentComments.length === 0) {
      throw createError('Parent comment not found', 'PARENT_NOT_FOUND', 404);
    }
  }

  const [result] = await config.query(
    `INSERT INTO comments (
      tenant_id, entity_type, entity_id, author_id, parent_id, body, mentions, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.tenantId,
      entityType,
      entityId,
      user.id,
      parent_id || null,
      body,
      mentions ? JSON.stringify(mentions) : null,
      attachments ? JSON.stringify(attachments) : null
    ]
  );

  const commentId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'comment', commentId.toString(), {
    entityType,
    entityId,
    body: body.substring(0, 100) + (body.length > 100 ? '...' : '')
  });

  res.status(201).json({
    id: commentId,
    entity_type: entityType,
    entity_id: entityId,
    author_id: user.id,
    parent_id,
    body,
    mentions,
    attachments,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/comments/{id} - Update comment (resolve/edit)
router.patch('/:id', [
  authenticate,
  param('id').isInt(),
  body('is_resolved').optional().isBoolean(),
  body('body').optional().isLength({ min: 1, max: 2000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const { is_resolved, body } = req.body;

  // Verify comment exists and user has access
  const [comments] = await config.query(
    'SELECT author_id, tenant_id FROM comments WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [id, user.tenantId]
  );

  if (comments.length === 0) {
    throw createError('Comment not found', 'NOT_FOUND', 404);
  }

  const comment = comments[0];

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  if (is_resolved !== undefined) {
    updateFields.push('is_resolved = ?');
    params.push(is_resolved);

    if (is_resolved) {
      updateFields.push('resolved_by = ?, resolved_at = NOW()');
      params.push(user.id, user.id);
    } else {
      updateFields.push('resolved_by = NULL, resolved_at = NULL');
    }
  }

  if (body !== undefined) {
    // Only author can edit body
    if (comment.author_id !== user.id) {
      throw createError('Only author can edit comment body', 'UNAUTHORIZED', 403);
    }

    updateFields.push('body = ?, edited_at = NOW()');
    params.push(body, body);
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_at = NOW()');
  params.push(id);

  await config.query(
    `UPDATE comments SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'comment', id, { is_resolved, body });

  res.json({ message: 'Comment updated successfully' });
}));

// DELETE /api/v1/comments/{id} - Delete comment
router.delete('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify comment exists and user owns it or is admin
  const [comments] = await config.query(
    'SELECT author_id, tenant_id FROM comments WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [id, user.tenantId]
  );

  if (comments.length === 0) {
    throw createError('Comment not found', 'NOT_FOUND', 404);
  }

  const comment = comments[0];

  // Only author or admin can delete
  if (comment.author_id !== user.id && user.role !== 'admin') {
    throw createError('Not authorized to delete this comment', 'UNAUTHORIZED', 403);
  }

  await config.query(
    'UPDATE comments SET deleted_at = NOW() WHERE id = ?',
    [id]
  );

  auditLogger.update(user.id.toString(), 'comment', id, { deleted: true });

  res.json({ message: 'Comment deleted successfully' });
}));

export default router;