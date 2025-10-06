import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/tags - List tags
router.get('/', [
  authenticate,
  query('q').optional(),
  query('entity_type').optional().isIn(['curriculum_framework', 'course_blueprint', 'unit_blueprint', 'unit_resource']),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { q, entity_type, page = 1, page_size = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(page_size);

  let whereConditions = ['t.tenant_id = ?'];
  let params: any[] = [user.tenantId];

  if (q) {
    whereConditions.push('t.name LIKE ?');
    params.push(`%${q}%`);
  }

  if (entity_type) {
    whereConditions.push('t.entity_type = ?');
    params.push(entity_type);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM tags t WHERE ${whereClause}`;
  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  // Get tags with usage count
  const tagsQuery = `
    SELECT
      t.*,
      COUNT(DISTINCT cft.framework_id) as framework_usage,
      COUNT(DISTINCT cb.tag_id) as course_usage,
      COUNT(DISTINCT ub.tag_id) as unit_usage,
      COUNT(DISTINCT ur.tag_id) as resource_usage
    FROM tags t
    LEFT JOIN curriculum_framework_tags cft ON t.id = cft.tag_id
    LEFT JOIN course_blueprint_tags cb ON t.id = cb.tag_id
    LEFT JOIN unit_blueprint_tags ub ON t.id = ub.tag_id
    LEFT JOIN unit_resource_tags ur ON t.id = ur.tag_id
    WHERE ${whereClause}
    GROUP BY t.id
    ORDER BY t.name ASC
    LIMIT ? OFFSET ?
  `;

  const finalParams = [...params, Number(page_size), offset];
  const [tags] = await config.query(tagsQuery, finalParams);

  res.json({
    data: tags,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// POST /api/v1/tags - Create tag
router.post('/', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  body('name').isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_ ]+$/),
  body('description').optional().isLength({ max: 200 }),
  body('entity_type').optional().isIn(['curriculum_framework', 'course_blueprint', 'unit_blueprint', 'unit_resource']),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const { name, description, entity_type, color = '#3B82F6' } = req.body;

  // Check for duplicate tag name
  const [existing] = await config.query(
    'SELECT id FROM tags WHERE tenant_id = ? AND name = ?',
    [user.tenantId, name]
  );

  if (existing.length > 0) {
    throw createError('Tag name already exists', 'DUPLICATE_TAG', 409);
  }

  const [result] = await config.query(
    `INSERT INTO tags (
      tenant_id, name, description, entity_type, color, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.tenantId, name, description || null, entity_type || null, color, user.id, user.id]
  );

  const tagId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'tag', tagId.toString(), { name });

  res.status(201).json({
    id: tagId,
    name,
    description,
    entity_type,
    color,
    usage_count: 0,
    created_at: new Date().toISOString()
  });
}));

// POST /api/v1/tags/{tagId}/attach - Attach tag to entity
router.post('/:tagId/attach', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('tagId').isInt(),
  body('entity_type').isIn(['curriculum_framework', 'course_blueprint', 'unit_blueprint', 'unit_resource']),
  body('entity_id').isInt()
], asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const user = req.user!;
  const { entity_type, entity_id } = req.body;

  // Verify tag exists and belongs to tenant
  const [tags] = await config.query(
    'SELECT id FROM tags WHERE id = ? AND tenant_id = ?',
    [tagId, user.tenantId]
  );

  if (tags.length === 0) {
    throw createError('Tag not found', 'NOT_FOUND', 404);
  }

  // Verify entity exists and user has access
  let entityCheck = false;
  switch (entity_type) {
    case 'curriculum_framework':
      const [frameworks] = await config.query(
        'SELECT id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ?',
        [entity_id, user.tenantId]
      );
      entityCheck = frameworks.length > 0;
      break;
    // Add other entity checks as needed
    default:
      entityCheck = true;
  }

  if (!entityCheck) {
    throw createError('Entity not found', 'NOT_FOUND', 404);
  }

  // Check if tag is already attached
  let tableName = '';
  switch (entity_type) {
    case 'curriculum_framework':
      tableName = 'curriculum_framework_tags';
      break;
    case 'course_blueprint':
      tableName = 'course_blueprint_tags';
      break;
    case 'unit_blueprint':
      tableName = 'unit_blueprint_tags';
      break;
    case 'unit_resource':
      tableName = 'unit_resource_tags';
      break;
  }

  const [existing] = await config.query(
    `SELECT id FROM ${tableName} WHERE tag_id = ? AND ${entity_type.replace('_', '')}_id = ?`,
    [tagId, entity_id]
  );

  if (existing.length > 0) {
    throw createError('Tag already attached to this entity', 'ALREADY_ATTACHED', 409);
  }

  // Attach tag
  const columnName = `${entity_type.replace('_', '')}_id`;
  await config.query(
    `INSERT INTO ${tableName} (tag_id, ${columnName}) VALUES (?, ?)`,
    [tagId, entity_id]
  );

  auditLogger.update(user.id.toString(), 'tag', tagId, {
    action: 'attach',
    entity_type,
    entity_id
  });

  res.json({ message: 'Tag attached successfully' });
}));

// DELETE /api/v1/tags/{tagId}/detach - Detach tag from entity
router.delete('/:tagId/detach', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('tagId').isInt(),
  body('entity_type').isIn(['curriculum_framework', 'course_blueprint', 'unit_blueprint', 'unit_resource']),
  body('entity_id').isInt()
], asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const user = req.user!;
  const { entity_type, entity_id } = req.body;

  // Verify tag exists and belongs to tenant
  const [tags] = await config.query(
    'SELECT id FROM tags WHERE id = ? AND tenant_id = ?',
    [tagId, user.tenantId]
  );

  if (tags.length === 0) {
    throw createError('Tag not found', 'NOT_FOUND', 404);
  }

  // Determine table and detach
  let tableName = '';
  switch (entity_type) {
    case 'curriculum_framework':
      tableName = 'curriculum_framework_tags';
      break;
    case 'course_blueprint':
      tableName = 'course_blueprint_tags';
      break;
    case 'unit_blueprint':
      tableName = 'unit_blueprint_tags';
      break;
    case 'unit_resource':
      tableName = 'unit_resource_tags';
      break;
  }

  const columnName = `${entity_type.replace('_', '')}_id`;
  const [result] = await config.query(
    `DELETE FROM ${tableName} WHERE tag_id = ? AND ${columnName} = ?`,
    [tagId, entity_id]
  );

  if ((result as any).affectedRows === 0) {
    throw createError('Tag not attached to this entity', 'NOT_ATTACHED', 404);
  }

  auditLogger.update(user.id.toString(), 'tag', tagId, {
    action: 'detach',
    entity_type,
    entity_id
  });

  res.json({ message: 'Tag detached successfully' });
}));

export default router;