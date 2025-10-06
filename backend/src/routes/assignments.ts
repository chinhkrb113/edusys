import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { auditLogger } from '../utils/logger';
import { ensureAssignmentsTable, ensurePracticeSessionsTable, seedAssignmentsForTenant } from '../utils/schemaInitializer';

const router = express.Router();

router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureAssignmentsTable();
    await ensurePracticeSessionsTable();
    next();
  } catch (error) {
    next(error);
  }
});

const parseAssignment = (row: any) => {
  const assignment = { ...row };

  const parseJson = (v: any, fallback: any) => {
    if (v === null || v === undefined) return fallback;
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return fallback;
    }
  };

  assignment.tags = parseJson(assignment.tags, []);
  assignment.objectives = parseJson(assignment.objectives, null);
  assignment.rubric = parseJson(assignment.rubric, null);
  assignment.attachments = parseJson(assignment.attachments, []);

  // Handle content - could be HTML-wrapped JSON or plain JSON
  if (assignment.content) {
    // Check if content is HTML-wrapped JSON (from RichTextEditor)
    if (typeof assignment.content === 'string' &&
        assignment.content.startsWith('<p>{') &&
        assignment.content.endsWith('}</p>')) {
      try {
        // Extract JSON from HTML wrapper
        const jsonContent = assignment.content.slice(3, -4); // Remove <p>{ and }</p>
        assignment.content = JSON.parse(jsonContent);
      } catch {
        // If parsing fails, keep as HTML string
        assignment.content = assignment.content;
      }
    } else {
      // Try to parse as JSON, fallback to string
      try {
        assignment.content = JSON.parse(assignment.content);
      } catch {
        // Keep as string if not valid JSON
        assignment.content = assignment.content;
      }
    }
  } else {
    assignment.content = null;
  }

  return assignment;
};

router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('level').optional().isString(),
  query('skill').optional().isString(),
  query('type').optional().isString(),
  query('difficulty').optional().isString(),
  query('visibility').optional().isIn(['public', 'private']),
  query('ownerOnly').optional().isString().isIn(['true', 'false']),
  query('content_type').optional().isIn(['mcq','true_false','matching','essay','audio','speaking','reading','project','worksheet','presentation','quiz','diagnostic'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;

  await seedAssignmentsForTenant(user.tenantId, user.id);
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
  const offset = (page - 1) * pageSize;

  const filters: string[] = ['tenant_id = ?', 'deleted_at IS NULL'];
  const params: any[] = [user.tenantId];

  const { search, level, skill, type, difficulty, visibility, ownerOnly, content_type } = req.query as any;

  if (search) {
    filters.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (level) {
    filters.push('level = ?');
    params.push(level);
  }

  if (skill) {
    filters.push('skill = ?');
    params.push(skill);
  }

  if (type) {
    filters.push('type = ?');
    params.push(type);
  }

  if (difficulty) {
    filters.push('difficulty = ?');
    params.push(difficulty);
  }

  if (visibility) {
    filters.push('visibility = ?');
    params.push(visibility);
  }

  if (ownerOnly === 'true') {
    filters.push('owner_user_id = ?');
    params.push(user.id);
  }

  if (content_type) {
    filters.push('content_type = ?');
    params.push(content_type);
  }

  const whereClause = filters.join(' AND ');
  const dataParams = [...params, pageSize, offset];
  const countParams = [...params];

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, level, skill, duration_minutes, type, description, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            content_type, content, version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM assignments
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  const [countRows] = await config.query(
    `SELECT COUNT(*) as total
     FROM assignments
     WHERE ${whereClause}`,
    countParams
  );

  const assignments = (rows as any[]).map(parseAssignment);
  const total = (countRows as any[])[0]?.total ?? 0;

  res.json({
    data: assignments,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: pageSize ? Math.ceil(total / pageSize) : 1
    }
  });
}));

router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, level, skill, duration_minutes, type, description, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            content_type, content, version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM assignments
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  if ((rows as any[]).length === 0) {
    throw createError('Assignment not found', 'NOT_FOUND', 404);
  }

  const assignment = parseAssignment((rows as any[])[0]);
  res.json({ assignment });
}));

router.post('/', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('title').isLength({ min: 1, max: 255 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('type').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('description').optional().isLength({ max: 2000 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('visibility').optional().isIn(['private', 'campus', 'tenant', 'public']),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('content_type').optional().isIn(['mcq','true_false','matching','essay','audio','speaking','reading','project','worksheet','presentation','quiz','diagnostic']),
  body('content').optional(),
  body('version_notes').optional().isLength({ max: 1000 }),
  body('techRequirements').optional().isArray({ max: 10 }),
  body('language').optional().isLength({ max: 32 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const {
    title,
    level,
    skill,
    type,
    duration_minutes = 0,
    description,
    tags = [],
    difficulty = null,
    visibility = 'private',
    objectives = null,
    rubric = null,
    attachments = [],
    content_type = null,
    content = null,
    version_notes = null,
    techRequirements = [],
    language = 'vietnamese'
  } = req.body;

  const [result] = await config.query(
    `INSERT INTO assignments (
      tenant_id, title, level, skill, type, duration_minutes, description, tags,
      difficulty, visibility, owner_user_id, objectives, rubric, attachments,
      content_type, content, version_number, parent_id, is_latest, version_notes,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.tenantId,
      title,
      level || null,
      skill || null,
      type || null,
      duration_minutes,
      description || null,
      tags && tags.length ? JSON.stringify(tags) : null,
      difficulty || null,
      visibility || 'private',
      user.id,
      objectives ? JSON.stringify(objectives) : null,
      rubric ? JSON.stringify(rubric) : null,
      attachments && attachments.length ? JSON.stringify(attachments) : null,
      content_type || null,
      content ? JSON.stringify(content) : null,
      1, // version_number
      null, // parent_id
      1, // is_latest
      version_notes || null,
      user.id,
      user.id
    ]
  );

  const insertedId = (result as any).insertId;

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, level, skill, duration_minutes, type, description, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            content_type, content, version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM assignments
     WHERE id = ?`,
    [insertedId]
  );

  const assignment = parseAssignment((rows as any[])[0]);

  auditLogger.create(user.id.toString(), 'assignment', insertedId.toString(), assignment);

  res.status(201).json({ assignment });
}));

router.patch('/:id', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('type').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('description').optional().isLength({ max: 2000 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isLength({ max: 16 }),
  body('visibility').optional().isIn(['public', 'private']),
  body('owner_user_id').optional().isInt(),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('content_type').optional().isIn(['mcq','true_false','matching','essay','audio','speaking','reading','project','worksheet','presentation','quiz','diagnostic']),
  body('content').optional(),
  body('version_notes').optional().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body as Record<string, any>;

  const [existingRows] = await config.query(
    `SELECT id
     FROM assignments
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if ((existingRows as any[]).length === 0) {
    throw createError('Assignment not found', 'NOT_FOUND', 404);
  }

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title);
  }
  if (updates.level !== undefined) {
    fields.push('level = ?');
    params.push(updates.level || null);
  }
  if (updates.skill !== undefined) {
    fields.push('skill = ?');
    params.push(updates.skill || null);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    params.push(updates.type || null);
  }
  if (updates.duration_minutes !== undefined) {
    fields.push('duration_minutes = ?');
    params.push(updates.duration_minutes);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description || null);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    params.push(updates.tags && updates.tags.length ? JSON.stringify(updates.tags) : null);
  }
  if (updates.difficulty !== undefined) {
    fields.push('difficulty = ?');
    params.push(updates.difficulty || null);
  }
  if (updates.visibility !== undefined) {
    fields.push('visibility = ?');
    params.push(updates.visibility || 'public');
  }
  if (updates.owner_user_id !== undefined) {
    fields.push('owner_user_id = ?');
    params.push(updates.owner_user_id || null);
  }
  if (updates.objectives !== undefined) {
    fields.push('objectives = ?');
    params.push(updates.objectives ? JSON.stringify(updates.objectives) : null);
  }
  if (updates.rubric !== undefined) {
    fields.push('rubric = ?');
    params.push(updates.rubric ? JSON.stringify(updates.rubric) : null);
  }
  if (updates.attachments !== undefined) {
    fields.push('attachments = ?');
    params.push(updates.attachments && updates.attachments.length ? JSON.stringify(updates.attachments) : null);
  }
  if (updates.content_type !== undefined) {
    fields.push('content_type = ?');
    params.push(updates.content_type || null);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    params.push(updates.content ? JSON.stringify(updates.content) : null);
  }
  if (updates.version_notes !== undefined) {
    fields.push('version_notes = ?');
    params.push(updates.version_notes || null);
  }

  if (!fields.length) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  fields.push('updated_by = ?', 'updated_at = NOW()');
  params.push(user.id, id);

  await config.query(
    `UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, level, skill, duration_minutes, type, description, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            content_type, content, version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM assignments
     WHERE id = ?`,
    [id]
  );

  const assignment = parseAssignment((rows as any[])[0]);
  // Skip audit logging for testing
  // auditLogger.update(mockUser.id.toString(), 'assignment', id.toString(), updates);

  res.json({ assignment });
}));

router.delete('/:id', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  console.log('DELETE /api/v1/assignments/:id called with ID:', id, 'by user:', user.id);

  const [existingRows] = await config.query(
    `SELECT id
     FROM assignments
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if ((existingRows as any[]).length === 0) {
    console.log('Assignment not found for deletion, ID:', id);
    throw createError('Assignment not found', 'NOT_FOUND', 404);
  }

  console.log('Found assignment for deletion, proceeding with soft delete, ID:', id);

  await config.query(
    'UPDATE assignments SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  console.log('Soft delete completed for assignment ID:', id);

  auditLogger.delete(user.id.toString(), 'assignment', id.toString());

  res.json({ message: 'Assignment deleted successfully' });
}));

router.post('/:id/start-practice', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  // Check if assignment exists
  const [assignmentRows] = await config.query(
    `SELECT id, tenant_id, title, visibility, owner_user_id
     FROM assignments
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  if ((assignmentRows as any[]).length === 0) {
    throw createError('Assignment not found', 'NOT_FOUND', 404);
  }

  const assignment = (assignmentRows as any[])[0];

  // Check visibility permissions (skip for testing)
  // if (assignment.visibility === 'private' && assignment.owner_user_id !== mockUser.id) {
  //   throw createError('You do not have permission to practice this assignment', 'FORBIDDEN', 403);
  // }

  // Check if user already has an in-progress session for this assignment
  const [existingSessionRows] = await config.query(
    `SELECT id, status
     FROM assignment_practice_sessions
     WHERE assignment_id = ? AND user_id = ? AND tenant_id = ? AND status = 'in_progress'`,
    [id, user.id, user.tenantId]
  );

  if ((existingSessionRows as any[]).length > 0) {
    // Return existing session
    const existingSession = (existingSessionRows as any[])[0];
    res.json({
      session: {
        id: existingSession.id,
        status: existingSession.status,
        message: 'Continuing existing practice session'
      }
    });
    return;
  }

  // Create new practice session
  const [result] = await config.query(
    `INSERT INTO assignment_practice_sessions (
      tenant_id, assignment_id, user_id, status, started_at
    ) VALUES (?, ?, ?, 'in_progress', NOW())`,
    [user.tenantId, id, user.id]
  );

  const sessionId = (result as any).insertId;

  // Skip audit logging for testing
  // auditLogger.create(mockUser.id.toString(), 'assignment_practice_session', sessionId.toString(), {
  //   assignment_id: id,
  //   action: 'start_practice'
  // });

  res.status(201).json({
    session: {
      id: sessionId,
      assignment_id: id,
      status: 'in_progress',
      started_at: new Date(),
      message: 'Practice session started successfully'
    }
  });
}));

export default router;
