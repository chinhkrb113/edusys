import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { auditLogger } from '../utils/logger';
import { ensureGamesTable, seedGamesForTenant } from '../utils/schemaInitializer';

const router = express.Router();

router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureGamesTable();
    next();
  } catch (error) {
    next(error);
  }
});

const parseGame = (row: any) => {
  const game = { ...row };

  const parseJson = (v: any, fallback: any) => {
    if (v === null || v === undefined) return fallback;
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return fallback;
    }
  };

  game.tags = parseJson(game.tags, []);
  game.objectives = parseJson(game.objectives, null);
  game.rubric = parseJson(game.rubric, null);
  game.attachments = parseJson(game.attachments, []);
  game.configuration = parseJson(game.configuration, null);
  game.external_api_config = parseJson(game.external_api_config, null);

  return game;
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
  query('ownerOnly').optional().isIn(['true','false']),
  query('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  await seedGamesForTenant(user.tenantId, user.id);
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
  const offset = (page - 1) * pageSize;

  const filters: string[] = ['tenant_id = ?', 'deleted_at IS NULL'];
  const params: any[] = [user.tenantId];

  const { search, level, skill, type, difficulty, visibility, ownerOnly, game_type } = req.query as any;

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

  if (game_type) {
    filters.push('game_type = ?');
    params.push(game_type);
  }

  const whereClause = filters.join(' AND ');
  const dataParams = [...params, pageSize, offset];
  const countParams = [...params];

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, type, level, skill, duration_minutes, players, description,
            plays_count, rating, api_integration, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            game_type, configuration, external_api_config, leaderboard_enabled,
            version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM games
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  const [countRows] = await config.query(
    `SELECT COUNT(*) as total
     FROM games
     WHERE ${whereClause}`,
    countParams
  );

  const games = (rows as any[]).map(parseGame);
  const total = (countRows as any[])[0]?.total ?? 0;

  res.json({
    data: games,
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
    `SELECT id, tenant_id, title, type, level, skill, duration_minutes, players, description,
            plays_count, rating, api_integration, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            game_type, configuration, external_api_config, leaderboard_enabled,
            version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM games
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if ((rows as any[]).length === 0) {
    throw createError('Game not found', 'NOT_FOUND', 404);
  }

  const game = parseGame((rows as any[])[0]);
  res.json({ game });
}));

router.post('/', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('title').isLength({ min: 1, max: 255 }),
  body('type').optional().isLength({ max: 64 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('players').optional().isLength({ max: 64 }),
  body('description').optional().isLength({ max: 2000 }),
  body('plays_count').optional().isInt({ min: 0 }),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('api_integration').optional().isLength({ max: 128 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isLength({ max: 16 }),
  body('visibility').optional().isIn(['public','private']),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom']),
  body('configuration').optional(),
  body('external_api_config').optional(),
  body('leaderboard_enabled').optional().isBoolean(),
  body('version_notes').optional().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const {
    title,
    type,
    level,
    skill,
    duration_minutes = 0,
    players,
    description,
    plays_count = 0,
    rating = 0,
    api_integration,
    tags = [],
    difficulty = null,
    visibility = 'public',
    objectives = null,
    rubric = null,
    attachments = [],
    game_type = null,
    configuration = null,
    external_api_config = null,
    leaderboard_enabled = true,
    version_notes = null
  } = req.body;

  const [result] = await config.query(
    `INSERT INTO games (
      tenant_id, title, type, level, skill, duration_minutes, players, description,
      plays_count, rating, api_integration, tags,
      difficulty, visibility, owner_user_id, objectives, rubric, attachments,
      game_type, configuration, external_api_config, leaderboard_enabled,
      version_number, parent_id, is_latest, version_notes,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.tenantId,
      title,
      type || null,
      level || null,
      skill || null,
      duration_minutes,
      players || null,
      description || null,
      plays_count,
      rating,
      api_integration || null,
      tags && tags.length ? JSON.stringify(tags) : null,
      difficulty || null,
      visibility || 'public',
      user.id,
      objectives ? JSON.stringify(objectives) : null,
      rubric ? JSON.stringify(rubric) : null,
      attachments && attachments.length ? JSON.stringify(attachments) : null,
      game_type || null,
      configuration ? JSON.stringify(configuration) : null,
      external_api_config ? JSON.stringify(external_api_config) : null,
      leaderboard_enabled,
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
    `SELECT id, tenant_id, title, type, level, skill, duration_minutes, players, description,
            plays_count, rating, api_integration, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            game_type, configuration, external_api_config, leaderboard_enabled,
            version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM games
     WHERE id = ?`,
    [insertedId]
  );

  const game = parseGame((rows as any[])[0]);

  auditLogger.create(user.id.toString(), 'game', insertedId.toString(), game);

  res.status(201).json({ game });
}));

router.patch('/:id', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('type').optional().isLength({ max: 64 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('players').optional().isLength({ max: 64 }),
  body('description').optional().isLength({ max: 2000 }),
  body('plays_count').optional().isInt({ min: 0 }),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('api_integration').optional().isLength({ max: 128 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isLength({ max: 16 }),
  body('visibility').optional().isIn(['public','private']),
  body('owner_user_id').optional().isInt(),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom']),
  body('configuration').optional(),
  body('external_api_config').optional(),
  body('leaderboard_enabled').optional().isBoolean(),
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
     FROM games
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if ((existingRows as any[]).length === 0) {
    throw createError('Game not found', 'NOT_FOUND', 404);
  }

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    params.push(updates.type || null);
  }
  if (updates.level !== undefined) {
    fields.push('level = ?');
    params.push(updates.level || null);
  }
  if (updates.skill !== undefined) {
    fields.push('skill = ?');
    params.push(updates.skill || null);
  }
  if (updates.duration_minutes !== undefined) {
    fields.push('duration_minutes = ?');
    params.push(updates.duration_minutes);
  }
  if (updates.players !== undefined) {
    fields.push('players = ?');
    params.push(updates.players || null);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description || null);
  }
  if (updates.plays_count !== undefined) {
    fields.push('plays_count = ?');
    params.push(updates.plays_count);
  }
  if (updates.rating !== undefined) {
    fields.push('rating = ?');
    params.push(updates.rating);
  }
  if (updates.api_integration !== undefined) {
    fields.push('api_integration = ?');
    params.push(updates.api_integration || null);
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
  if (updates.game_type !== undefined) {
    fields.push('game_type = ?');
    params.push(updates.game_type || null);
  }
  if (updates.configuration !== undefined) {
    fields.push('configuration = ?');
    params.push(updates.configuration ? JSON.stringify(updates.configuration) : null);
  }
  if (updates.external_api_config !== undefined) {
    fields.push('external_api_config = ?');
    params.push(updates.external_api_config ? JSON.stringify(updates.external_api_config) : null);
  }
  if (updates.leaderboard_enabled !== undefined) {
    fields.push('leaderboard_enabled = ?');
    params.push(updates.leaderboard_enabled);
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
    `UPDATE games SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  const [rows] = await config.query(
    `SELECT id, tenant_id, title, type, level, skill, duration_minutes, players, description,
            plays_count, rating, api_integration, tags,
            difficulty, visibility, owner_user_id, objectives, rubric, attachments,
            game_type, configuration, external_api_config, leaderboard_enabled,
            version_number, parent_id, is_latest, version_notes,
            created_by, updated_by, created_at, updated_at
     FROM games
     WHERE id = ?`,
    [id]
  );

  const game = parseGame((rows as any[])[0]);
  auditLogger.update(user.id.toString(), 'game', id.toString(), updates);

  res.json({ game });
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

  const [existingRows] = await config.query(
    `SELECT id
     FROM games
     WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
    [id, user.tenantId]
  );

  if ((existingRows as any[]).length === 0) {
    throw createError('Game not found', 'NOT_FOUND', 404);
  }

  await config.query(
    'UPDATE games SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, id]
  );

  auditLogger.delete(user.id.toString(), 'game', id.toString());

  res.json({ message: 'Game deleted successfully' });
}));

export default router;
