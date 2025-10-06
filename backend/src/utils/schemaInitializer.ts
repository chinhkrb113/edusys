import { config } from '../config/database';
import { logger } from './logger';
import type { RowDataPacket } from 'mysql2';

let assignmentsInitialized = false;
let gamesInitialized = false;
let practiceSessionsInitialized = false;
const seededAssignmentsTenants = new Set<number>();
const seededGamesTenants = new Set<number>();

// Helpers to perform idempotent schema changes on MySQL versions without IF NOT EXISTS
const columnExists = async (table: string, column: string): Promise<boolean> => {
  const [rows] = await config.query<RowDataPacket[]>(
    `SELECT COUNT(*) as c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  const c = Number((rows[0] as any)?.c ?? 0);
  return c > 0;
};

const indexExists = async (table: string, indexName: string): Promise<boolean> => {
  const [rows] = await config.query<RowDataPacket[]>(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
    [indexName]
  );
  return (rows as any[]).length > 0;
};

const constraintExists = async (table: string, constraintName: string): Promise<boolean> => {
  const [rows] = await config.query<RowDataPacket[]>(
    `SELECT COUNT(*) as c
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?`,
    [table, constraintName]
  );
  const c = Number((rows[0] as any)?.c ?? 0);
  return c > 0;
};

const ensureColumn = async (table: string, column: string, definition: string) => {
  if (!(await columnExists(table, column))) {
    await config.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
};

const ensureIndex = async (table: string, indexName: string, definition: string) => {
  if (!(await indexExists(table, indexName))) {
    await config.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${definition})`);
  }
};

const ensureFk = async (table: string, constraintName: string, definition: string) => {
  if (!(await constraintExists(table, constraintName))) {
    try {
      await config.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`);
    } catch (e) {
      // FK creation can fail if existing data violates it; log and continue
      logger.warn(`Skipping FK ${constraintName} on ${table}:`, e as any);
    }
  }
};

const assignmentsDDL = `
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  level VARCHAR(32) NULL,
  skill VARCHAR(64) NULL,
  duration_minutes INT DEFAULT 0,
  type VARCHAR(64) NULL,
  description TEXT NULL,
  tags JSON NULL,
  -- New taxonomy/metadata fields
  difficulty VARCHAR(16) NULL,
  visibility ENUM('public','private') DEFAULT 'public',
  owner_user_id INT NOT NULL,
  objectives JSON NULL,
  rubric JSON NULL,
  attachments JSON NULL,
  -- Phase 2: Content types and rich content
  content_type ENUM('mcq','true_false','matching','essay','audio','speaking','reading','project','worksheet','presentation','quiz','diagnostic') NULL,
  content JSON NULL COMMENT 'Rich content structure with questions, media, etc.',
  -- Phase 2: Versioning system
  version_number INT DEFAULT 1,
  parent_id INT NULL COMMENT 'Original assignment ID for versioning',
  is_latest TINYINT(1) DEFAULT 1,
  version_notes TEXT NULL,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assignments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE,
  INDEX idx_assignments_tenant_level (tenant_id, level),
  INDEX idx_assignments_tenant_skill (tenant_id, skill),
  INDEX idx_assignments_title (title(191)),
  INDEX idx_assignments_visibility (tenant_id, visibility),
  INDEX idx_assignments_difficulty (tenant_id, difficulty),
  INDEX idx_assignments_owner (tenant_id, owner_user_id),
  INDEX idx_assignments_content_type (tenant_id, content_type),
  INDEX idx_assignments_version (parent_id, version_number, is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const gamesDDL = `
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(64) NULL,
  level VARCHAR(32) NULL,
  skill VARCHAR(64) NULL,
  duration_minutes INT DEFAULT 0,
  players VARCHAR(64) NULL,
  description TEXT NULL,
  plays_count INT DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  api_integration VARCHAR(128) NULL,
  tags JSON NULL,
  -- New taxonomy/metadata fields
  difficulty VARCHAR(16) NULL,
  visibility ENUM('public','private') DEFAULT 'public',
  owner_user_id INT NOT NULL,
  objectives JSON NULL,
  rubric JSON NULL,
  attachments JSON NULL,
  -- Phase 2: Enhanced game features
  game_type ENUM('flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom') NULL,
  configuration JSON NULL COMMENT 'Game-specific configuration (questions, settings, templates)',
  external_api_config JSON NULL COMMENT 'External API settings (Kahoot ID, Quizizz URL, etc.)',
  leaderboard_enabled TINYINT(1) DEFAULT 1,
  -- Phase 2: Versioning system
  version_number INT DEFAULT 1,
  parent_id INT NULL COMMENT 'Original game ID for versioning',
  is_latest TINYINT(1) DEFAULT 1,
  version_notes TEXT NULL,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_games_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_games_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE,
  CONSTRAINT fk_games_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE,
  CONSTRAINT fk_games_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE,
  INDEX idx_games_tenant_type (tenant_id, type),
  INDEX idx_games_tenant_skill (tenant_id, skill),
  INDEX idx_games_title (title(191)),
  INDEX idx_games_visibility (tenant_id, visibility),
  INDEX idx_games_difficulty (tenant_id, difficulty),
  INDEX idx_games_owner (tenant_id, owner_user_id),
  INDEX idx_games_game_type (tenant_id, game_type),
  INDEX idx_games_version (parent_id, version_number, is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const practiceSessionsDDL = `
CREATE TABLE IF NOT EXISTS assignment_practice_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED NOT NULL,
  assignment_id INT NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  time_spent_seconds INT DEFAULT 0,
  answers JSON NULL COMMENT 'User answers/responses for quiz-type assignments',
  score DECIMAL(5,2) NULL COMMENT 'Score out of 100 if applicable',
  feedback TEXT NULL COMMENT 'Teacher feedback if provided',
  metadata JSON NULL COMMENT 'Additional session data',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const resolveTenantUserId = async (tenantId: number, fallbackUserId: number): Promise<number> => {
  const [rows] = await config.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE tenant_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
    [tenantId]
  );

  if (rows.length > 0) {
    const row = rows[0] as RowDataPacket & { id: number };
    return Number(row.id);
  }

  return fallbackUserId;
};

export const ensureAssignmentsTable = async (): Promise<void> => {
  if (assignmentsInitialized) return;

  try {
    // Base table
    await config.query(assignmentsDDL);

    // Columns (avoid NOT NULL to be safe with existing rows; business logic can enforce later)
    await ensureColumn('assignments', 'difficulty', `VARCHAR(16) NULL`);
    await ensureColumn('assignments', 'visibility', `ENUM('public','private') DEFAULT 'public'`);
    await ensureColumn('assignments', 'owner_user_id', `BIGINT UNSIGNED NULL`);
    await ensureColumn('assignments', 'objectives', `JSON NULL`);
    await ensureColumn('assignments', 'rubric', `JSON NULL`);
    await ensureColumn('assignments', 'attachments', `JSON NULL`);

    // Phase 2: Content types and rich content
    await ensureColumn('assignments', 'content_type', `ENUM('mcq','true_false','matching','essay','audio','speaking','reading','project','worksheet','presentation','quiz','diagnostic') NULL`);
    await ensureColumn('assignments', 'content', `JSON NULL`);

    // Phase 2: Versioning system
    await ensureColumn('assignments', 'version_number', `INT DEFAULT 1`);
    await ensureColumn('assignments', 'parent_id', `INT NULL`);
    await ensureColumn('assignments', 'is_latest', `TINYINT(1) DEFAULT 1`);
    await ensureColumn('assignments', 'version_notes', `TEXT NULL`);

    // Indexes
    await ensureIndex('assignments', 'idx_assignments_visibility', '`tenant_id`, `visibility`');
    await ensureIndex('assignments', 'idx_assignments_difficulty', '`tenant_id`, `difficulty`');
    await ensureIndex('assignments', 'idx_assignments_owner', '`tenant_id`, `owner_user_id`');

    // Foreign key (owner)
    await ensureFk(
      'assignments',
      'fk_assignments_owner',
      `FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE CASCADE`
    );

    assignmentsInitialized = true;
  } catch (error) {
    logger.error('Failed to ensure assignments table exists', { error });
    throw error;
  }
};

export const ensureGamesTable = async (): Promise<void> => {
  if (gamesInitialized) return;

  try {
    // Base table
    await config.query(gamesDDL);

    // Columns
    await ensureColumn('games', 'difficulty', `VARCHAR(16) NULL`);
    await ensureColumn('games', 'visibility', `ENUM('public','private') DEFAULT 'public'`);
    await ensureColumn('games', 'owner_user_id', `BIGINT UNSIGNED NULL`);
    await ensureColumn('games', 'objectives', `JSON NULL`);
    await ensureColumn('games', 'rubric', `JSON NULL`);
    await ensureColumn('games', 'attachments', `JSON NULL`);

    // Phase 2: Enhanced game features
    await ensureColumn('games', 'game_type', `ENUM('flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom') NULL`);
    await ensureColumn('games', 'configuration', `JSON NULL`);
    await ensureColumn('games', 'external_api_config', `JSON NULL`);
    await ensureColumn('games', 'leaderboard_enabled', `TINYINT(1) DEFAULT 1`);

    // Phase 2: Versioning system
    await ensureColumn('games', 'version_number', `INT DEFAULT 1`);
    await ensureColumn('games', 'parent_id', `INT NULL`);
    await ensureColumn('games', 'is_latest', `TINYINT(1) DEFAULT 1`);
    await ensureColumn('games', 'version_notes', `TEXT NULL`);

    // Indexes
    await ensureIndex('games', 'idx_games_visibility', '`tenant_id`, `visibility`');
    await ensureIndex('games', 'idx_games_difficulty', '`tenant_id`, `difficulty`');
    await ensureIndex('games', 'idx_games_owner', '`tenant_id`, `owner_user_id`');

    // Foreign key
    await ensureFk(
      'games',
      'fk_games_owner',
      `FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE CASCADE`
    );

    gamesInitialized = true;
  } catch (error) {
    logger.error('Failed to ensure games table exists', { error });
    throw error;
  }
};

interface CountRow extends RowDataPacket {
  total?: number;
  count?: number;
}

const ASSIGNMENT_SAMPLES = [
  {
    title: 'Reading Comprehension: The Digital Age',
    level: 'B2',
    skill: 'Reading',
    type: 'Worksheet',
    durationMinutes: 30,
    description: 'Analyze an article about technology habits and answer comprehension questions.',
    tags: ['Reading', 'Technology', 'Critical Thinking'],
  },
  {
    title: 'IELTS Speaking Practice: Memorable Trip',
    level: 'B2-C1',
    skill: 'Speaking',
    type: 'Presentation',
    durationMinutes: 15,
    description: 'Prepare a 2-minute talk describing a memorable journey and answer follow-up questions.',
    tags: ['IELTS', 'Speaking', 'Fluency'],
  },
  {
    title: 'Grammar Diagnostic: Verb Tenses',
    level: 'A2-B1',
    skill: 'Grammar',
    type: 'Quiz',
    durationMinutes: 20,
    description: 'Mixed-tense diagnostic quiz to identify gaps in students’ tense usage.',
    tags: ['Grammar', 'Assessment'],
  },
  {
    title: 'Essay Writing: Social Media Impact',
    level: 'C1',
    skill: 'Writing',
    type: 'Essay',
    durationMinutes: 60,
    description: 'Write a 250-word opinion essay discussing the influence of social media on society.',
    tags: ['Writing', 'Opinion Essay'],
  },
];

const GAME_SAMPLES = [
  {
    title: 'Vocabulary Flashcards',
    type: 'Flashcard',
    level: 'A1',
    skill: 'Vocabulary',
    durationMinutes: 15,
    players: 'Cá nhân',
    description: 'Interactive flashcards with audio pronunciation for foundational vocabulary.',
    playsCount: 1200,
    rating: 4.5,
    apiIntegration: null,
    tags: ['Vocabulary', 'Audio', 'Interactive'],
  },
  {
    title: 'Grammar Quiz Battle',
    type: 'Quiz',
    level: 'B1',
    skill: 'Grammar',
    durationMinutes: 20,
    players: '1-4 người',
    description: 'Competitive live quiz with instant leaderboard for grammar review.',
    playsCount: 860,
    rating: 4.7,
    apiIntegration: 'Kahoot',
    tags: ['Grammar', 'Competition'],
  },
  {
    title: 'Listening Challenge',
    type: 'Audio Game',
    level: 'A2',
    skill: 'Listening',
    durationMinutes: 10,
    players: 'Cá nhân',
    description: 'Listen to short clips and fill in missing words to test listening accuracy.',
    playsCount: 2050,
    rating: 4.3,
    apiIntegration: null,
    tags: ['Listening', 'Audio'],
  },
  {
    title: 'Speaking Role-play',
    type: 'Role-play',
    level: 'C1',
    skill: 'Speaking',
    durationMinutes: 25,
    players: '2 người',
    description: 'AI-powered conversation practice with context-based prompts and scoring.',
    playsCount: 480,
    rating: 4.8,
    apiIntegration: 'Custom AI',
    tags: ['Speaking', 'AI', 'Conversation'],
  },
];

export const seedAssignmentsForTenant = async (tenantId: number, fallbackUserId: number): Promise<void> => {
  if (seededAssignmentsTenants.has(tenantId)) {
    return;
  }

  await ensureAssignmentsTable();

  const [countRows] = await config.query<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM assignments WHERE tenant_id = ? AND deleted_at IS NULL',
    [tenantId]
  );
  const total = Number((countRows[0] as CountRow)?.total ?? (countRows[0] as CountRow)?.count ?? 0);

  if (total > 0) {
    seededAssignmentsTenants.add(tenantId);
    return;
  }

  const ownerId = await resolveTenantUserId(tenantId, fallbackUserId);

  for (const sample of ASSIGNMENT_SAMPLES) {
    await config.query(
      `INSERT INTO assignments (
        tenant_id, title, level, skill, type, duration_minutes, description, tags,
        difficulty, visibility, owner_user_id, objectives, rubric, attachments,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        sample.title,
        sample.level,
        sample.skill,
        sample.type,
        sample.durationMinutes,
        sample.description,
        sample.tags.length ? JSON.stringify(sample.tags) : null,
        'medium', 'public', ownerId, null, null, null,
        ownerId,
        ownerId,
      ]
    );
  }

  seededAssignmentsTenants.add(tenantId);
};

export const seedGamesForTenant = async (tenantId: number, fallbackUserId: number): Promise<void> => {
  if (seededGamesTenants.has(tenantId)) {
    return;
  }

  await ensureGamesTable();

  const [countRows] = await config.query<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM games WHERE tenant_id = ? AND deleted_at IS NULL',
    [tenantId]
  );
  const total = Number((countRows[0] as CountRow)?.total ?? (countRows[0] as CountRow)?.count ?? 0);

  if (total > 0) {
    seededGamesTenants.add(tenantId);
    return;
  }

  const ownerId = await resolveTenantUserId(tenantId, fallbackUserId);

  for (const sample of GAME_SAMPLES) {
    await config.query(
      `INSERT INTO games (
        tenant_id, title, type, level, skill, duration_minutes, players, description,
        plays_count, rating, api_integration, tags,
        difficulty, visibility, owner_user_id, objectives, rubric, attachments,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        sample.title,
        sample.type,
        sample.level,
        sample.skill,
        sample.durationMinutes,
        sample.players,
        sample.description,
        sample.playsCount,
        sample.rating,
        sample.apiIntegration,
        sample.tags.length ? JSON.stringify(sample.tags) : null,
        'medium', 'public', ownerId, null, null, null,
        ownerId,
        ownerId,
      ]
    );
  }

  seededGamesTenants.add(tenantId);
};

export const ensurePracticeSessionsTable = async (): Promise<void> => {
  if (practiceSessionsInitialized) return;

  try {
    // Create table
    await config.query(practiceSessionsDDL);

    practiceSessionsInitialized = true;
  } catch (error) {
    logger.error('Failed to ensure practice sessions table exists', { error });
    throw error;
  }
};
