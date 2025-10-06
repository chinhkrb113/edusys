import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/courses/{id} - Get course details
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [courses] = await config.query(
    `SELECT cb.*,
            cfv.framework_id,
            cf.tenant_id,
            cfv.version_no,
            cfv.state as version_state,
            cf.name as framework_name
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  const course = courses[0];

  // Parse JSON fields
  if (course.learning_outcomes) {
    course.learning_outcomes = JSON.parse(course.learning_outcomes);
  }
  if (course.assessment_types) {
    course.assessment_types = JSON.parse(course.assessment_types);
  }

  res.json(course);
}));

// GET /api/v1/versions/{versionId}/courses - Get courses by version
router.get('/versions/:versionId/courses', [
  authenticate,
  param('versionId').isInt()
], asyncHandler(async (req, res) => {
  const { versionId } = req.params;
  const user = req.user!;

  // Verify version belongs to user's tenant
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id, cfv.version_no, cfv.state
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cf.tenant_id = ?`,
    [versionId, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  // Get courses for this version
  const [courses] = await config.query(
    `SELECT cb.*,
            cfv.framework_id,
            cf.name as framework_name
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.version_id = ? AND cb.deleted_at IS NULL
     ORDER BY cb.order_index ASC`,
    [versionId]
  );

  // Parse JSON fields for each course
  courses.forEach((course: any) => {
    if (course.learning_outcomes) {
      course.learning_outcomes = JSON.parse(course.learning_outcomes);
    }
    if (course.assessment_types) {
      course.assessment_types = JSON.parse(course.assessment_types);
    }
  });

  res.json({ courses });
}));

// POST /api/v1/versions/{versionId}/courses - Create course
// POST /api/v1/versions/{versionId}/courses - Create course
router.post('/versions/:versionId/courses', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('versionId').isInt(),
  body('code').optional().isLength({ min: 1, max: 64 }).matches(/^[A-Z0-9-_]+$/),
  body('title').isLength({ min: 1, max: 255 }),
  body('level').optional(),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('summary').optional().isLength({ max: 1000 }),
  body('learning_outcomes').optional(),
  body('assessment_types').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { versionId } = req.params;
  const user = req.user!;
  const {
    code,
    title,
    level,
    hours = 0,
    order_index = 0,
    summary,
    learning_outcomes,
    assessment_types
  } = req.body;

  // Verify version exists and belongs to user's tenant
  const [versions] = await config.query(
    'SELECT framework_id FROM curriculum_framework_versions WHERE id = ? AND deleted_at IS NULL',
    [versionId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const frameworkId = versions[0].framework_id;

  // Verify framework belongs to user's tenant
  const [frameworks] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [frameworkId, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Framework not found', 'NOT_FOUND', 404);
  }

  // Check for duplicate code within version
  if (code) {
    const [existing] = await config.query(
      'SELECT id FROM course_blueprints WHERE version_id = ? AND code = ? AND deleted_at IS NULL',
      [versionId, code]
    );

    if (existing.length > 0) {
      throw createError('Course code already exists in this version', 'DUPLICATE_CODE', 409);
    }
  }

  const [result] = await config.query(
    `INSERT INTO course_blueprints (
      version_id, code, title, level, hours, order_index, summary,
      learning_outcomes, assessment_types, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      versionId,
      code || null,
      title,
      level || null,
      hours,
      order_index,
      summary || null,
      learning_outcomes ? JSON.stringify(learning_outcomes) : null,
      assessment_types ? JSON.stringify(assessment_types) : null,
      user.id,
      user.id
    ]
  );

  const courseId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'course_blueprint', courseId.toString(), {
    versionId,
    title,
    code
  });

  res.status(201).json({
    id: courseId,
    version_id: versionId,
    code,
    title,
    level,
    hours,
    order_index,
    summary,
    learning_outcomes,
    assessment_types,
    created_at: new Date().toISOString()
  });
}));

// PATCH /api/v1/courses/{id} - Update course
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('level').optional(),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('summary').optional().isLength({ max: 1000 }),
  body('learning_outcomes').optional(),
  body('assessment_types').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Verify course exists and user has access
  const [courses] = await config.query(
    `SELECT cb.*, cfv.framework_id, cf.tenant_id
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  const course = courses[0];

  // Check if version is frozen (pending review or later)
  if (course.state && ['pending_review', 'approved', 'published'].includes(course.state)) {
    throw createError('Cannot modify course in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Build update query
  const updateFields: string[] = [];
  const params: any[] = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (['learning_outcomes', 'assessment_types'].includes(key)) {
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
    `UPDATE course_blueprints SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'course_blueprint', id, updates);

  res.json({ message: 'Course updated successfully' });
}));

// DELETE /api/v1/courses/{id} - Delete course
router.delete('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  // Verify course exists and user has access
  const [courses] = await config.query(
    `SELECT cb.*, cfv.framework_id, cf.tenant_id, cfv.state
     FROM course_blueprints cb
     INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cb.id = ? AND cb.deleted_at IS NULL AND cf.tenant_id = ?`,
    [id, user.tenantId]
  );

  if (courses.length === 0) {
    throw createError('Course not found', 'NOT_FOUND', 404);
  }

  const course = courses[0];

  // Check if version is frozen
  if (course.state && ['pending_review', 'approved', 'published'].includes(course.state)) {
    throw createError('Cannot delete course from approved or published version', 'VERSION_FROZEN', 403);
  }

  // Soft delete
  await config.query(
    'UPDATE course_blueprints SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  auditLogger.update(user.id.toString(), 'course_blueprint', id, { deleted: true });

  res.json({ message: 'Course deleted successfully' });
}));

// POST /api/v1/courses:reorder - Reorder courses within version
router.post('/reorder', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  body('version_id').isInt(),
  body('orders').isArray(),
  body('orders.*.course_id').isInt(),
  body('orders.*.order_index').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const { version_id, orders } = req.body;

  // Verify version belongs to user's tenant
  const [versions] = await config.query(
    `SELECT cfv.id, cf.tenant_id, cfv.state
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cf.tenant_id = ?`,
    [version_id, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const version = versions[0];

  // Check if version is frozen
  if (version.state && ['pending_review', 'approved', 'published'].includes(version.state)) {
    throw createError('Cannot reorder courses in approved or published version', 'VERSION_FROZEN', 403);
  }

  // Update order indexes in transaction
  await config.transaction(async (connection) => {
    for (const order of orders) {
      await connection.execute(
        'UPDATE course_blueprints SET order_index = ?, updated_by = ?, updated_at = NOW() WHERE id = ? AND version_id = ?',
        [order.order_index, user.id, order.course_id, version_id]
      );
    }
  });

  auditLogger.update(user.id.toString(), 'course_blueprint', `version_${version_id}`, {
    action: 'reorder',
    orders
  });

  res.json({ message: 'Courses reordered successfully' });
}));

export default router;