import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize, requireTenantAccess } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/kct - List curriculum frameworks
router.get('/', [
  authenticate,
  query('status').optional().isIn(['draft', 'pending_review', 'approved', 'published', 'archived']),
  query('language').optional().isLength({ min: 2, max: 10 }),
  query('age_group').optional().isIn(['kids', 'teens', 'adults', 'all']),
  query('target_level').optional(),
  query('owner_user_id').optional().isInt(),
  query('campus_id').optional().isInt(),
  query('tag').optional(),
  query('q').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const {
    status,
    language,
    age_group,
    target_level,
    owner_user_id,
    campus_id,
    tag,
    q,
    page = 1,
    page_size = 20
  } = req.query;

  const user = req.user!;
  const offset = (Number(page) - 1) * Number(page_size);



  // Build WHERE clause
  let whereConditions = ['cf.tenant_id = ? AND cf.deleted_at IS NULL'];
  let params: any[] = [user.tenantId];

  if (status) {
    whereConditions.push('cf.status = ?');
    params.push(status);
  }

  if (language) {
    whereConditions.push('cf.language = ?');
    params.push(language);
  }

  if (age_group) {
    whereConditions.push('cf.age_group = ?');
    params.push(age_group);
  }

  if (target_level) {
    whereConditions.push('cf.target_level = ?');
    params.push(target_level);
  }

  if (owner_user_id) {
    whereConditions.push('cf.owner_user_id = ?');
    params.push(owner_user_id);
  }

  if (campus_id) {
    whereConditions.push('cf.campus_id = ?');
    params.push(campus_id);
  }

  // Tag filtering (join with curriculum_framework_tags)
  let tagJoin = '';
  if (tag) {
    tagJoin = `
      INNER JOIN curriculum_framework_tags cft ON cf.id = cft.framework_id
      INNER JOIN tags t ON cft.tag_id = t.id AND t.name = ?
    `;
    params.push(tag);
  }

  // Search query
  if (q) {
    whereConditions.push('(cf.name LIKE ? OR cf.code LIKE ? OR cf.description LIKE ?)');
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT cf.id) as total
    FROM curriculum_frameworks cf
    ${tagJoin}
    WHERE ${whereClause}
  `;

  console.log('Count query:', countQuery);
  console.log('Count params:', params);

  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  console.log('Total count result:', total);

  // Get frameworks with latest version info - Use SAME whereClause and params as count query
  const frameworksQuery = `
    SELECT
      cf.id,
      cf.code,
      cf.name,
      cf.language,
      cf.total_hours,
      cf.total_sessions,
      cf.session_duration_hours,
      cf.learning_method,
      cf.learning_format,
      cf.status,
      cf.owner_user_id,
      cf.updated_at,
      cf.target_level,
      cf.age_group,
      cf.description,
      u.full_name as owner_name
    FROM curriculum_frameworks cf
    LEFT JOIN users u ON cf.owner_user_id = u.id
    ${tagJoin}
    WHERE ${whereClause}
    ORDER BY cf.updated_at DESC
  `;

   console.log('Same params for both queries:', params); // Debug
   console.log('Frameworks query:', frameworksQuery.replace(/\s+/g, ' ')); // Debug
   const [frameworks] = await config.query(frameworksQuery, params);

  // Manual pagination (temporary fix)
  const startIndex = offset;
  const endIndex = startIndex + Number(page_size);
  const paginatedFrameworks = frameworks.slice(startIndex, endIndex);

  console.log('Framework query returned:', frameworks.length, 'records');
  console.log('Paginated (page', page, 'size', page_size, '):', paginatedFrameworks.length, 'records');

  // Language display mapping
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'jp': 'Japanese',
    'vi': 'Vietnamese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
  };

  // Get tags for each framework and add display language
  for (const framework of frameworks) {
    const [tags] = await config.query(
      `SELECT t.name
       FROM tags t
       INNER JOIN curriculum_framework_tags cft ON t.id = cft.tag_id
       WHERE cft.framework_id = ?`,
      [framework.id]
    );
    framework.tags = tags.map((t: any) => t.name);

    // Add display language
    framework.displayLanguage = languageMap[framework.language] || framework.language;
  }

  res.json({
    data: frameworks,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// POST /api/v1/kct - Create curriculum framework
router.post('/', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  body('code').isLength({ min: 1, max: 64 }).matches(/^[A-Z0-9-_]+$/),
  body('name').isLength({ min: 1, max: 255 }),
  body('language').isLength({ min: 2, max: 10 }),
  body('target_level').optional(),
  body('age_group').optional().isIn(['kids', 'teens', 'adults', 'all']),
  body('total_hours').optional().isInt({ min: 0 }),
  body('total_sessions').optional().isInt({ min: 0 }),
  body('session_duration_hours').optional().isFloat({ min: 0 }),
  body('learning_method').optional().isLength({ max: 128 }),
  body('learning_format').optional().isLength({ max: 128 }),
  body('campus_id').optional().isInt(),
  body('description').optional().isLength({ max: 2000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const {
    code,
    name,
    language,
    target_level,
    age_group,
    total_hours = 0,
    campus_id,
    description
  } = req.body;

  // Check for duplicate code
  const [existing] = await config.query(
    'SELECT id FROM curriculum_frameworks WHERE tenant_id = ? AND code = ? AND deleted_at IS NULL',
    [user.tenantId, code]
  );

  if (existing.length > 0) {
    throw createError('Curriculum code already exists', 'DUPLICATE_CODE', 409);
  }

  // Verify campus belongs to tenant
  if (campus_id) {
    const [campuses] = await config.query(
      'SELECT id FROM campuses WHERE id = ? AND tenant_id = ?',
      [campus_id, user.tenantId]
    );

    if (campuses.length === 0) {
      throw createError('Invalid campus', 'INVALID_CAMPUS', 400);
    }
  }

  const result = await config.transaction(async (connection) => {
  // Insert framework
    const [frameworkResult] = await connection.execute(
      `INSERT INTO curriculum_frameworks (
        tenant_id, campus_id, code, name, language, target_level, age_group,
        total_hours, total_sessions, session_duration_hours, learning_method, learning_format,
        status, owner_user_id, description, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
      [
        user.tenantId,
        campus_id || null,
        code,
        name,
        language,
        target_level || null,
        age_group || null,
        total_hours,
        req.body.total_sessions || 0,
        req.body.session_duration_hours || null,
        req.body.learning_method || null,
        req.body.learning_format || null,
        user.id,
        description || null,
        user.id,
        user.id
      ]
    );

    const frameworkId = (frameworkResult as any).insertId;

    // Create initial version
    const [versionResult] = await connection.execute(
      `INSERT INTO curriculum_framework_versions (
        framework_id, version_no, state, changelog, created_by, updated_by
      ) VALUES (?, 'v1.0', 'draft', 'Initial version', ?, ?)`,
      [frameworkId, user.id, user.id]
    );

    const versionId = (versionResult as any).insertId;

    // Update framework with latest version
    await connection.execute(
      'UPDATE curriculum_frameworks SET latest_version_id = ? WHERE id = ?',
      [versionId, frameworkId]
    );

    return { frameworkId, versionId };
  });

  auditLogger.create(user.id.toString(), 'curriculum_framework', result.frameworkId.toString(), {
    code,
    name,
    language
  });

  res.status(201).json({
    id: result.frameworkId,
    code,
    name,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}));

// GET /api/v1/kct/:id - Get curriculum framework details
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [frameworks] = await config.query(
    `SELECT
      cf.*,
      cfv.id as latest_version_id,
      cfv.version_no as latest_version_no,
      cfv.state as latest_version_state,
      u.full_name as owner_name
     FROM curriculum_frameworks cf
     LEFT JOIN curriculum_framework_versions cfv ON cf.latest_version_id = cfv.id
     LEFT JOIN users u ON cf.owner_user_id = u.id
     WHERE cf.id = ? AND cf.tenant_id = ? AND cf.deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
  }

  const framework = frameworks[0];

  // Language display mapping
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'jp': 'Japanese',
    'vi': 'Vietnamese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
  };

  // Get tags and add display language
  const [tags] = await config.query(
    `SELECT t.name
     FROM tags t
     INNER JOIN curriculum_framework_tags cft ON t.id = cft.tag_id
     WHERE cft.framework_id = ?`,
    [id]
  );

  framework.tags = tags.map((t: any) => t.name);
  framework.displayLanguage = languageMap[framework.language] || framework.language;

  res.json(framework);
}));

// PATCH /api/v1/kct/:id - Update curriculum framework
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('name').optional().isLength({ min: 1, max: 255 }),
  body('target_level').optional(),
  body('age_group').optional().isIn(['kids', 'teens', 'adults', 'all']),
  body('total_hours').optional().isInt({ min: 0 }),
  body('total_sessions').optional().isInt({ min: 0 }),
  body('session_duration_hours').optional().isFloat({ min: 0 }),
  body('learning_method').optional().isLength({ max: 128 }),
  body('learning_format').optional().isLength({ max: 128 }),
  body('description').optional().isLength({ max: 2000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  // Check ownership and permissions
  const [frameworks] = await config.query(
    'SELECT owner_user_id, status FROM curriculum_frameworks WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
    [id, user.tenantId]
  );

  if (frameworks.length === 0) {
    throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
  }

  const framework = frameworks[0];

  // Only owner or admin can edit published frameworks
  if (framework.status === 'published' && framework.owner_user_id !== user.id && user.role !== 'admin') {
    throw createError('Cannot edit published framework', 'CANNOT_EDIT_PUBLISHED', 403);
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
    `UPDATE curriculum_frameworks SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  auditLogger.update(user.id.toString(), 'curriculum_framework', id, updates);

  res.json({ message: 'Curriculum framework updated successfully' });
}));

// DELETE /api/v1/kct/:id - Soft delete curriculum framework
router.delete('/:id', [
  authenticate,
  authorize('program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [result] = await config.query(
    `UPDATE curriculum_frameworks
     SET deleted_at = NOW(), updated_by = ?
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [user.id, id, user.tenantId]
  );

  if ((result as any).affectedRows === 0) {
    throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
  }

  auditLogger.update(user.id.toString(), 'curriculum_framework', id, { deleted: true });

  res.json({ message: 'Curriculum framework deleted successfully' });
}));

// TEST ENDPOINT WITHOUT AUTHENTICATION (DEVELOPMENT ONLY)
// REMOVE IN PRODUCTION
router.get('/test-data', asyncHandler(async (req, res) => {
  // This endpoint bypasses authentication for testing
  console.log('TEST ENDPOINT: Accessing curriculum data without auth');

  // Mock user tenant ID (normally from auth token)
  const mockTenantId = 1;

  // Get frameworks with all new fields
  const frameworksQuery = `
    SELECT
      cf.id,
      cf.code,
      cf.name,
      cf.language,
      cf.total_hours,
      cf.total_sessions,
      cf.session_duration_hours,
      cf.learning_method,
      cf.learning_format,
      cf.status,
      cf.owner_user_id,
      cf.updated_at,
      cf.target_level,
      cf.age_group,
      cf.description
    FROM curriculum_frameworks cf
    WHERE cf.tenant_id = ? AND cf.deleted_at IS NULL
    ORDER BY cf.updated_at DESC
    LIMIT 5
  `;

  const [frameworks] = await config.query(frameworksQuery, [mockTenantId]);

  console.log('Test endpoint returning', frameworks.length, 'frameworks');

  res.json({
    data: frameworks,
    total: frameworks.length,
    message: 'Test data - no authentication required',
    timestamp: new Date().toISOString()
  });
}));

export default router;
