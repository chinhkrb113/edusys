import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/units/templates - Get unit templates
router.get('/templates', [
  authenticate,
  query('level').optional(),
  query('skill').optional()
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { level, skill } = req.query;

  // Note: This assumes a unit_templates table exists
  // For now, return a mock response since the table doesn't exist in schema
  const mockTemplates = [
    {
      id: 'template-1',
      title: 'Basic Conversation Unit',
      level: 'beginner',
      skills: ['listening', 'speaking'],
      estimated_time: 120
    },
    {
      id: 'template-2',
      title: 'Grammar Focus Unit',
      level: 'intermediate',
      skills: ['grammar', 'writing'],
      estimated_time: 90
    },
    {
      id: 'template-3',
      title: 'Reading Comprehension Unit',
      level: 'advanced',
      skills: ['reading', 'vocabulary'],
      estimated_time: 150
    }
  ];

  // Filter mock templates based on query params
  let filteredTemplates = mockTemplates;

  if (level) {
    filteredTemplates = filteredTemplates.filter(t => t.level === level);
  }

  if (skill && typeof skill === 'string') {
    filteredTemplates = filteredTemplates.filter(t =>
      t.skills.includes(skill)
    );
  }

  res.json(filteredTemplates);
}));

// GET /api/v1/units/{id} - Get unit details
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [units] = await config.query(
    `SELECT ub.*,
            cb.title as course_title,
            cb.version_id,
            cfv.framework_id,
            cf.tenant_id,
            cfv.version_no,
            cfv.state as version_state,
            cf.name as framework_name
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  const unit = units[0];

  // Parse JSON fields
  if (unit.objectives) {
    unit.objectives = JSON.parse(unit.objectives);
  }
  if (unit.skills) {
    unit.skills = JSON.parse(unit.skills);
  }
  if (unit.activities) {
    unit.activities = JSON.parse(unit.activities);
  }
  if (unit.rubric) {
    unit.rubric = JSON.parse(unit.rubric);
  }

  res.json(unit);
}));

// GET /api/v1/courses/{courseId}/units - Get units by course
router.get('/courses/:courseId/units', [
  authenticate,
  param('courseId').isInt()
], asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user!;

  // Verify course belongs to user's tenant
  const [courses] = await config.query(
    `SELECT cb.id, cf.tenant_id, cb.title as course_title,
            cfv.framework_id, cf.name as framework_name
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [courseId, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  // Get units for this course
  const [units] = await config.query(
    `SELECT ub.*,
            cb.title as course_title,
            cfv.version_no,
            cfv.state as version_state
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     WHERE ub.course_blueprint_id = ? AND ub.deleted_at IS NULL
     ORDER BY ub.order_index ASC`,
    [courseId]
  );

  // Parse JSON fields for each unit
  units.forEach((unit: any) => {
    if (unit.objectives) {
      unit.objectives = JSON.parse(unit.objectives);
    }
    if (unit.skills) {
      unit.skills = JSON.parse(unit.skills);
    }
    if (unit.activities) {
      unit.activities = JSON.parse(unit.activities);
    }
    if (unit.rubric) {
      unit.rubric = JSON.parse(unit.rubric);
    }
  });

  res.json({ units });
}));

// POST /api/v1/courses/{courseId}/units - Create unit
router.post('/courses/:courseId/units', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('courseId').isInt(),
  body('title').isLength({ min: 1, max: 255 }),
  body('objectives').optional(),
  body('skills').optional(),
  body('activities').optional(),
  body('rubric').optional(),
  body('homework').optional(),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('estimated_time').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { courseId } = req.params;
  const user = req.user!;
  const {
    title,
    objectives,
    skills,
    activities,
    rubric,
    homework,
    hours = 0,
    order_index = 0,
    difficulty_level = 'intermediate',
    estimated_time
  } = req.body;

  // Verify course exists and user has access
  const [courses] = await config.query(
    `SELECT cb.*, cfv.framework_id, cf.tenant_id, cfv.state
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [courseId, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  const course = courses[0];

  // Check if version is frozen
  if (course.state && ['pending_review', 'approved', 'published'].includes(course.state)) {
    throw createError('Cannot add units to approved or published version', 'VERSION_FROZEN', 403);
  }

  // Calculate completeness score
  let completenessScore = 0;
  if (objectives && Array.isArray(objectives) && objectives.length > 0) completenessScore += 20;
  if (skills && Array.isArray(skills) && skills.length > 0) completenessScore += 15;
  if (activities && Array.isArray(activities) && activities.length > 0) completenessScore += 20;
  if (rubric) completenessScore += 25;
  // Resources will be checked separately when counting existing resources

  const [result] = await config.query(
    `INSERT INTO unit_blueprints (
      course_blueprint_id, title, objectives, skills, activities, rubric, homework,
      hours, order_index, completeness_score, difficulty_level, estimated_time,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      courseId,
      title,
      objectives ? JSON.stringify(objectives) : null,
      skills ? JSON.stringify(skills) : null,
      activities ? JSON.stringify(activities) : null,
      rubric ? JSON.stringify(rubric) : null,
      homework || null,
      hours,
      order_index,
      completenessScore,
      difficulty_level,
      estimated_time || null,
      user.id,
      user.id
    ]
  );

  const unitId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'unit_blueprint', unitId.toString(), {
    courseId,
    title
  });

  res.status(201).json({
    id: unitId,
    course_blueprint_id: courseId,
    title,
    objectives,
    skills,
    activities,
    rubric,
    homework,
    hours,
    order_index,
    completeness_score: completenessScore,
    difficulty_level,
    estimated_time,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/units/{id} - Update unit
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('objectives').optional(),
  body('skills').optional(),
  body('activities').optional(),
  body('rubric').optional(),
  body('homework').optional(),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('estimated_time').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify unit exists and user has access
  const [units] = await config.query(
    `SELECT ub.*, cb.version_id, cfv.framework_id, cf.tenant_id, cfv.state
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  const unit = units[0];

  // Check if version is frozen
  if (unit.state && ['pending_review', 'approved', 'published'].includes(unit.state)) {
    throw createError('Cannot modify unit in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (['objectives', 'skills', 'activities', 'rubric'].includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(JSON.stringify(updates[key]));
      } else {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }
  });

  // Recalculate completeness score if content fields changed
  const contentFields = ['objectives', 'skills', 'activities', 'rubric'];
  const hasContentChanges = contentFields.some(field => updates[field] !== undefined);

  if (hasContentChanges || updateFields.length > 0) {
    let completenessScore = 0;
    const finalObjectives = updates.objectives !== undefined ? updates.objectives : (unit.objectives ? JSON.parse(unit.objectives) : []);
    const finalSkills = updates.skills !== undefined ? updates.skills : (unit.skills ? JSON.parse(unit.skills) : []);
    const finalActivities = updates.activities !== undefined ? updates.activities : (unit.activities ? JSON.parse(unit.activities) : []);
    const finalRubric = updates.rubric !== undefined ? updates.rubric : unit.rubric;

    if (finalObjectives && Array.isArray(finalObjectives) && finalObjectives.length > 0) completenessScore += 20;
    if (finalSkills && Array.isArray(finalSkills) && finalSkills.length > 0) completenessScore += 15;
    if (finalActivities && Array.isArray(finalActivities) && finalActivities.length > 0) completenessScore += 20;
    if (finalRubric) completenessScore += 25;

    // Check for existing resources
    const [resources] = await config.query(
      'SELECT COUNT(*) as count FROM unit_resources WHERE unit_id = ? AND deleted_at IS NULL',
      [id]
    );

    if (resources[0].count > 0) completenessScore += 20;

    updateFields.push('completeness_score = ?');
    params.push(completenessScore);
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_by = ?', 'updated_at = NOW()');
  params.push(user.id, id);

  await config.query(
    `UPDATE unit_blueprints SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'unit_blueprint', id, updates);

  res.json({ message: 'Unit updated successfully' });
}));

// DELETE /api/v1/units/{id} - Delete unit
router.delete('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify unit exists and user has access
  const [units] = await config.query(
    `SELECT ub.*, cfv.state
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  const unit = units[0];

  // Check if version is frozen
  if (unit.state && ['pending_review', 'approved', 'published'].includes(unit.state)) {
    throw createError('Cannot delete unit from approved or published version', 'VERSION_FROZEN', 403);
  }

  // Soft delete
  await config.query(
    'UPDATE unit_blueprints SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  auditLogger.update(user.id.toString(), 'unit_blueprint', id, { deleted: true });

  res.json({ message: 'Unit deleted successfully' });
}));

// POST /api/v1/units:reorder - Reorder units within course
router.post('/reorder', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  body('course_id').isInt(),
  body('orders').isArray(),
  body('orders.*.unit_id').isInt(),
  body('orders.*.order_index').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const { course_id, orders } = req.body;
  // Verify course belongs to user's tenant and version is not frozen
  const [courses] = await config.query(
    `SELECT cb.*, cfv.state, cf.tenant_id
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [course_id, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  const course = courses[0];

  // Check if version is frozen
  if (course.state && ['pending_review', 'approved', 'published'].includes(course.state)) {
    throw createError('Cannot reorder units in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Update order indexes in transaction
  await config.transaction(async (connection) => {
    for (const order of orders) {
      await connection.execute(
        'UPDATE unit_blueprints SET order_index = ?, updated_by = ?, updated_at = NOW() WHERE id = ? AND course_blueprint_id = ?',
        [order.order_index, user.id, order.unit_id, course_id]
      );
    }
  });

  auditLogger.update(user.id.toString(), 'unit_blueprint', `course_${course_id}`, {
    action: 'reorder',
    orders
  });

  res.json({ message: 'Units reordered successfully' });
}));

// POST /api/v1/units/{id}/split - Split unit into multiple units
router.post('/:id/split', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('split_after_order_index').isInt({ min: 0 }),
  body('new_unit_title').isLength({ min: 1, max: 255 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const { split_after_order_index, new_unit_title } = req.body;

  // Verify unit exists and user has access
  const [units] = await config.query(
    `SELECT ub.*, cb.course_blueprint_id, cfv.state
     FROM unit_blueprints ub
     INNER JOIN course_blueprints cb ON ub.course_blueprint_id = cb.id
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE ub.id = ? AND ub.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (units.length === 0) {
    throw createError('Unit not found', 'NOT_FOUND', 404);
  }

  const unit = units[0];

  // Check if version is frozen
  if (unit.state && ['pending_review', 'approved', 'published'].includes(unit.state)) {
    throw createError('Cannot split unit in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Create new unit with incremented order index
  const newOrderIndex = split_after_order_index + 1;

  await config.query(
    `INSERT INTO unit_blueprints (
      course_blueprint_id, title, order_index, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?)`,
    [unit.course_blueprint_id, new_unit_title, newOrderIndex, user.id, user.id]
  );

  // Update subsequent units' order indexes
  await config.query(
    'UPDATE unit_blueprints SET order_index = order_index + 1, updated_by = ?, updated_at = NOW() WHERE course_blueprint_id = ? AND order_index > ? AND id != ?',
    [user.id, unit.course_blueprint_id, split_after_order_index, id]
  );

  auditLogger.update(user.id.toString(), 'unit_blueprint', id, {
    action: 'split',
    new_unit_title,
    split_after_order_index
  });

  res.json({ message: 'Unit split successfully' });
}));

export default router;