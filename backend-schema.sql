-- ===========================================
-- Curriculum Management System - MySQL Schema (Idempotent)
-- Version: 1.0.2
-- Notes:
--  - Uses InnoDB + utf8mb4
--  - Avoids circular FK (no FK on latest_version_id)
--  - FULLTEXT over JSON via STORED generated column
-- ===========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================================
-- MASTER TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique tenant code',
  name VARCHAR(255) NOT NULL COMMENT 'Display name',
  domain VARCHAR(255) NULL COMMENT 'Primary domain',
  is_active TINYINT(1) DEFAULT 1,
  settings JSON NULL COMMENT 'Tenant-specific settings',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campuses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(32) NULL,
  is_active TINYINT(1) DEFAULT 1,
  settings JSON NULL COMMENT 'Campus-specific settings',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_tenant_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_tenant_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('super_admin','admin','bgh','program_owner','curriculum_designer','teacher','qa','viewer') NOT NULL,
  campus_id BIGINT UNSIGNED NULL COMMENT 'Primary campus',
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  preferences JSON NULL COMMENT 'UI preferences',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_tenant_email (tenant_id, email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- CURRICULUM FRAMEWORK CORE
-- ===========================================

-- No FK on latest_version_id (managed by trigger/app)
CREATE TABLE IF NOT EXISTS curriculum_frameworks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NULL COMMENT 'Scope to specific campus, NULL for global',
  code VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique code like EN-KIDS-A1',
  name VARCHAR(255) NOT NULL,
  language VARCHAR(32) NOT NULL COMMENT 'en, vi, jp, etc.',
  target_level VARCHAR(64) NULL COMMENT 'CEFR A1, IELTS 6.0, etc.',
  age_group ENUM('kids','teens','adults','all') NULL,
  total_hours INT UNSIGNED DEFAULT 0,
  status ENUM('draft','pending_review','approved','published','archived') DEFAULT 'draft',
  owner_user_id BIGINT UNSIGNED NULL COMMENT 'Program Owner',
  latest_version_id BIGINT UNSIGNED NULL COMMENT 'Pointer only; no FK, avoid circular ref',
  description TEXT NULL,
  learning_objectives JSON NULL COMMENT 'Array of main objectives',
  prerequisites JSON NULL COMMENT 'Required prior knowledge',
  assessment_strategy TEXT NULL,
  deleted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE SET NULL ON DELETE SET NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_tenant_campus (tenant_id, campus_id),
  INDEX idx_status (status),
  INDEX idx_owner (owner_user_id),
  INDEX idx_code (code),
  INDEX idx_language (language),
  INDEX idx_age_group (age_group),
  INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS curriculum_framework_versions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  framework_id BIGINT UNSIGNED NOT NULL,
  version_no VARCHAR(32) NOT NULL COMMENT 'v1.0, v1.1, v2.0',
  state ENUM('draft','pending_review','approved','published','archived') DEFAULT 'draft',
  is_frozen TINYINT(1) DEFAULT 0 COMMENT 'Freeze content when pending review',
  changelog TEXT NULL COMMENT 'What changed in this version',
  review_deadline TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  archived_reason TEXT NULL,
  metadata JSON NULL COMMENT 'Version metadata',
  deleted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_framework_version (framework_id, version_no),
  FOREIGN KEY (framework_id) REFERENCES curriculum_frameworks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_framework_state (framework_id, state),
  INDEX idx_state_created (state, created_at),
  INDEX idx_frozen (is_frozen),
  INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- BLUEPRINT STRUCTURE (Courses, Units, Resources)
-- ===========================================

CREATE TABLE IF NOT EXISTS course_blueprints (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  version_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NULL,
  level VARCHAR(64) NULL COMMENT 'Specific level if different from framework',
  hours INT UNSIGNED DEFAULT 0,
  order_index INT UNSIGNED DEFAULT 0,
  summary TEXT NULL,
  learning_outcomes JSON NULL COMMENT 'Specific outcomes for this course',
  assessment_types JSON NULL COMMENT 'Quiz, project, exam, etc.',
  prerequisites TEXT NULL,
  deleted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (version_id) REFERENCES curriculum_framework_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_version_order (version_id, order_index),
  INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE: FULLTEXT on JSON is not allowed; use STORED generated column for objectives_fts
CREATE TABLE IF NOT EXISTS unit_blueprints (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  course_blueprint_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NULL,
  objectives JSON NULL COMMENT 'Learning objectives array',
  skills JSON NULL COMMENT 'Required skills: listening, speaking, reading, writing, grammar, vocabulary, pronunciation',
  activities JSON NULL COMMENT 'Class activities with types and durations',
  rubric JSON NULL COMMENT 'Assessment criteria and levels',
  homework JSON NULL COMMENT 'Homework assignments',
  hours INT UNSIGNED DEFAULT 0,
  order_index INT UNSIGNED DEFAULT 0,
  completeness_score TINYINT UNSIGNED DEFAULT 0 COMMENT '0-100 based on field completion',
  difficulty_level ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
  estimated_time INT UNSIGNED NULL COMMENT 'Estimated completion time in minutes',
  notes TEXT NULL,
  ai_generated TINYINT(1) DEFAULT 0,
  ai_confidence DECIMAL(3,2) NULL COMMENT 'AI generation confidence 0.00-1.00',
  deleted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- STORED generated column to index JSON objectives
  objectives_fts TEXT
    GENERATED ALWAYS AS (
      CASE
        WHEN objectives IS NULL THEN NULL
        ELSE REPLACE(
               REPLACE(
                 REPLACE(
                   JSON_UNQUOTE(JSON_EXTRACT(objectives, '$')),
                 '[',''),
               ']',''),
             '"','')
      END
    ) STORED,

  FOREIGN KEY (course_blueprint_id) REFERENCES course_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_course_order (course_blueprint_id, order_index),
  INDEX idx_completeness (completeness_score),
  INDEX idx_deleted (deleted_at),
  FULLTEXT INDEX ft_title_objectives (title, objectives_fts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS unit_resources (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  unit_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('pdf','slide','video','audio','link','doc','image','worksheet','interactive') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  url TEXT NULL COMMENT 'External URL',
  file_path TEXT NULL COMMENT 'Internal file path',
  file_size BIGINT UNSIGNED NULL COMMENT 'File size in bytes',
  mime_type VARCHAR(128) NULL,
  ocr_text LONGTEXT NULL COMMENT 'OCR extracted text for search',
  ai_tags JSON NULL COMMENT 'Auto-generated tags: {skill, level, topic, confidence}',
  manual_tags JSON NULL COMMENT 'Manually added tags',
  license_type VARCHAR(64) NULL COMMENT 'Copyright, CC-BY, etc.',
  license_note TEXT NULL,
  accessibility_features JSON NULL COMMENT 'Captions, transcripts, alt-text',
  health_status ENUM('healthy','broken','expired','restricted','unknown') DEFAULT 'unknown',
  last_health_check TIMESTAMP NULL,
  order_index INT UNSIGNED DEFAULT 0,
  is_required TINYINT(1) DEFAULT 0,
  download_count INT UNSIGNED DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (unit_id) REFERENCES unit_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_unit_order (unit_id, order_index),
  INDEX idx_kind (kind),
  INDEX idx_health (health_status),
  INDEX idx_required (is_required),
  INDEX idx_deleted (deleted_at),
  FULLTEXT INDEX ft_ocr_title (ocr_text, title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- MAPPING & DEPLOYMENT
-- ===========================================

CREATE TABLE IF NOT EXISTS kct_mappings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  framework_id BIGINT UNSIGNED NOT NULL,
  version_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('course_template','class_instance') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL COMMENT 'ID of target course or class',
  campus_id BIGINT UNSIGNED NULL COMMENT 'Specific campus deployment',
  rollout_batch VARCHAR(64) NULL COMMENT 'Staged rollout identifier',
  rollout_phase ENUM('planned','pilot','phased','full') DEFAULT 'planned',
  mismatch_report JSON NULL COMMENT 'Validation issues found during mapping',
  risk_assessment ENUM('low','medium','high','critical') DEFAULT 'low',
  override_reason TEXT NULL COMMENT 'Justification for overrides',
  status ENUM('planned','validated','applied','failed','rolled_back') DEFAULT 'planned',
  applied_at TIMESTAMP NULL,
  rolled_back_at TIMESTAMP NULL,
  rollback_reason TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (framework_id) REFERENCES curriculum_frameworks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES curriculum_framework_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_framework_version (framework_id, version_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_status (status),
  INDEX idx_rollout (rollout_batch, rollout_phase),
  INDEX idx_risk (risk_assessment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TAGGING SYSTEM
-- ===========================================

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  category VARCHAR(32) NULL COMMENT 'skill, topic, level, etc.',
  color VARCHAR(16) NULL COMMENT 'Hex color for UI',
  description TEXT NULL,
  is_system TINYINT(1) DEFAULT 0 COMMENT 'Cannot be deleted if system',
  usage_count INT UNSIGNED DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_tenant_name (tenant_id, name),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS curriculum_framework_tags (
  framework_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (framework_id, tag_id),
  FOREIGN KEY (framework_id) REFERENCES curriculum_frameworks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS unit_blueprint_tags (
  unit_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (unit_id, tag_id),
  FOREIGN KEY (unit_id) REFERENCES unit_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- COLLABORATION & WORKFLOW
-- ===========================================

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  entity_type VARCHAR(64) NOT NULL COMMENT 'framework,version,course,unit,resource,mapping',
  entity_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NULL, -- allow NULL for ON DELETE SET NULL
  parent_id BIGINT UNSIGNED NULL COMMENT 'For threaded replies',
  body TEXT NOT NULL,
  mentions JSON NULL COMMENT 'User IDs mentioned',
  attachments JSON NULL COMMENT 'File attachments',
  is_resolved TINYINT(1) DEFAULT 0,
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at TIMESTAMP NULL,
  edited_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_author (author_id),
  INDEX idx_resolved (is_resolved),
  INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approvals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  version_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NULL,          -- ✅ cho phép NULL
  assigned_reviewer_id BIGINT UNSIGNED NULL,
  status ENUM('requested','in_review','approved','rejected','escalated') DEFAULT 'requested',
  priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
  review_deadline TIMESTAMP NULL,
  decision TEXT NULL,
  decision_made_by BIGINT UNSIGNED NULL,
  decision_made_at TIMESTAMP NULL,
  escalation_reason TEXT NULL,
  escalated_to BIGINT UNSIGNED NULL,
  escalated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES curriculum_framework_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,   -- giữ SET NULL
  FOREIGN KEY (assigned_reviewer_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  FOREIGN KEY (decision_made_by) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  FOREIGN KEY (escalated_to) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_version_status (version_id, status),
  INDEX idx_reviewer (assigned_reviewer_id),
  INDEX idx_priority (priority),
  INDEX idx_deadline (review_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================
-- UI PERSISTENCE & ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS saved_views (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL,
  view_type ENUM('framework_list','unit_editor','reports') NOT NULL,
  is_shared TINYINT(1) DEFAULT 0,
  is_default TINYINT(1) DEFAULT 0,
  filters JSON NULL,
  columns JSON NULL,
  sort_config JSON NULL,
  layout_config JSON NULL,
  usage_count INT UNSIGNED DEFAULT 0,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_owner_type (owner_id, view_type),
  INDEX idx_shared (is_shared),
  INDEX idx_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- AUDIT & COMPLIANCE
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(128) NULL COMMENT 'User session identifier',
  action VARCHAR(64) NOT NULL COMMENT 'create,update,delete,approve,publish,export,map,etc.',
  entity_type VARCHAR(64) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  old_values JSON NULL COMMENT 'Previous state for updates',
  new_values JSON NULL COMMENT 'New state for updates',
  metadata JSON NULL COMMENT 'Additional context',
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_actor_action (actor_id, action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at),
  INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- ANALYTICS & REPORTING TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS kct_usage_tracking (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  framework_id BIGINT UNSIGNED NOT NULL,
  version_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('course','class') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL COMMENT 'Who accessed/used',
  action ENUM('view','edit','export','apply','teach') NOT NULL,
  duration_seconds INT UNSIGNED NULL COMMENT 'Time spent',
  completion_percentage TINYINT UNSIGNED NULL COMMENT 'For student progress',
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (framework_id) REFERENCES curriculum_frameworks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES curriculum_framework_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE SET NULL ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL,
  INDEX idx_framework_date (framework_id, created_at),
  INDEX idx_user_action (user_id, action),
  INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_outcomes_tracking (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  framework_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL COMMENT 'External student ID',
  unit_id BIGINT UNSIGNED NULL,
  assessment_type VARCHAR(64) NOT NULL COMMENT 'quiz, exam, project, etc.',
  score DECIMAL(5,2) NULL COMMENT '0.00-100.00',
  max_score DECIMAL(5,2) DEFAULT 100.00,
  grade VARCHAR(4) NULL COMMENT 'A+, A, B+, etc.',
  skills_assessed JSON NULL COMMENT 'Skills evaluated',
  feedback TEXT NULL,
  completed_at TIMESTAMP NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (framework_id) REFERENCES curriculum_frameworks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_class_student (class_id, student_id),
  INDEX idx_unit (unit_id),
  INDEX idx_assessment (assessment_type),
  INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- SETTINGS & CONFIGURATION
-- ===========================================

CREATE TABLE IF NOT EXISTS settings (
  tenant_id BIGINT UNSIGNED PRIMARY KEY,
  hours_tolerance DECIMAL(4,2) DEFAULT 0.5 COMMENT 'Hours mismatch tolerance',
  draft_export_watermark TINYINT(1) DEFAULT 1,
  required_skills_by_level JSON NULL COMMENT '{"A1":["listening","speaking"], "A2":[...]}',
  cefr_minima JSON NULL COMMENT 'Minimum coverage requirements',
  max_draft_age_days INT DEFAULT 30,
  require_qr_for_published_exports TINYINT(1) DEFAULT 1,
  allow_override_with_justification TINYINT(1) DEFAULT 1,
  default_campus_branding JSON NULL,
  ai_generation_enabled TINYINT(1) DEFAULT 1,
  auto_health_checks_enabled TINYINT(1) DEFAULT 1,
  webhook_endpoints JSON NULL COMMENT 'External webhook URLs',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- TRIGGERS (idempotent)
-- ===========================================

DELIMITER //

DROP TRIGGER IF EXISTS trg_cf_version_after_insert//
CREATE TRIGGER trg_cf_version_after_insert
AFTER INSERT ON curriculum_framework_versions
FOR EACH ROW
BEGIN
  UPDATE curriculum_frameworks
  SET latest_version_id = NEW.id,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.framework_id;
END//

DROP TRIGGER IF EXISTS trg_course_after_insert//
CREATE TRIGGER trg_course_after_insert
AFTER INSERT ON course_blueprints
FOR EACH ROW
BEGIN
  UPDATE curriculum_frameworks cf
  SET cf.total_hours = (
    SELECT COALESCE(SUM(cb.hours), 0)
    FROM course_blueprints cb
    INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
    WHERE cfv.framework_id = cf.id AND cfv.state = 'published'
  ),
  cf.updated_at = CURRENT_TIMESTAMP
  WHERE cf.id = (
    SELECT framework_id FROM curriculum_framework_versions WHERE id = NEW.version_id
  );
END//

DROP TRIGGER IF EXISTS trg_course_after_update//
CREATE TRIGGER trg_course_after_update
AFTER UPDATE ON course_blueprints
FOR EACH ROW
BEGIN
  IF OLD.hours != NEW.hours THEN
    UPDATE curriculum_frameworks cf
    SET cf.total_hours = (
      SELECT COALESCE(SUM(cb.hours), 0)
      FROM course_blueprints cb
      INNER JOIN curriculum_framework_versions cfv ON cb.version_id = cfv.id
      WHERE cfv.framework_id = cf.id AND cfv.state = 'published'
    ),
    cf.updated_at = CURRENT_TIMESTAMP
    WHERE cf.id = (
      SELECT framework_id FROM curriculum_framework_versions WHERE id = NEW.version_id
    );
  END IF;
END//

DROP TRIGGER IF EXISTS trg_unit_completeness//
CREATE TRIGGER trg_unit_completeness
BEFORE UPDATE ON unit_blueprints
FOR EACH ROW
BEGIN
  SET NEW.completeness_score = (
    (CASE WHEN JSON_LENGTH(NEW.objectives) > 0 THEN 20 ELSE 0 END) +
    (CASE WHEN JSON_LENGTH(NEW.skills) > 0 THEN 15 ELSE 0 END) +
    (CASE WHEN JSON_LENGTH(NEW.activities) > 0 THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.rubric IS NOT NULL THEN 25 ELSE 0 END) +
    (CASE WHEN EXISTS(
      SELECT 1 FROM unit_resources
      WHERE unit_id = NEW.id AND deleted_at IS NULL
    ) THEN 20 ELSE 0 END)
  );
END//

DROP TRIGGER IF EXISTS trg_audit_framework_changes//
CREATE TRIGGER trg_audit_framework_changes
AFTER UPDATE ON curriculum_frameworks
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status OR OLD.latest_version_id != NEW.latest_version_id THEN
    INSERT INTO audit_logs (tenant_id, actor_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (
      NEW.tenant_id,
      NEW.updated_by,
      'update',
      'curriculum_framework',
      NEW.id,
      JSON_OBJECT('status', OLD.status, 'latest_version_id', OLD.latest_version_id),
      JSON_OBJECT('status', NEW.status, 'latest_version_id', NEW.latest_version_id)
    );
  END IF;
END//

DELIMITER ;

-- ===========================================
-- INITIAL DATA (idempotent)
-- ===========================================

INSERT INTO settings (
  tenant_id, hours_tolerance, draft_export_watermark,
  required_skills_by_level, cefr_minima
) VALUES
  (1, 0.5, 1,
   '{"A1":["listening","speaking"],"A2":["listening","speaking","reading"],"B1":["listening","speaking","reading","writing"]}',
   '{"A1":{"min_units":3,"min_skills":2},"A2":{"min_units":4,"min_skills":3}}'
)
ON DUPLICATE KEY UPDATE
  hours_tolerance = VALUES(hours_tolerance),
  draft_export_watermark = VALUES(draft_export_watermark),
  required_skills_by_level = VALUES(required_skills_by_level),
  cefr_minima = VALUES(cefr_minima);

SET FOREIGN_KEY_CHECKS = 1;


-- Assignments bank table
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `level` VARCHAR(32) NULL,
  `skill` VARCHAR(64) NULL,
  `duration_minutes` INT DEFAULT 0,
  `type` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `tags` JSON NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  CONSTRAINT `fk_assignments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  INDEX `idx_assignments_tenant_level` (`tenant_id`, `level`),
  INDEX `idx_assignments_tenant_skill` (`tenant_id`, `skill`),
  INDEX `idx_assignments_title` (`title`(191))
);


-- Games bank table
CREATE TABLE IF NOT EXISTS `games` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(64) NULL,
  `level` VARCHAR(32) NULL,
  `skill` VARCHAR(64) NULL,
  `duration_minutes` INT DEFAULT 0,
  `players` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `plays_count` INT DEFAULT 0,
  `rating` DECIMAL(3,1) DEFAULT 0.0,
  `api_integration` VARCHAR(128) NULL,
  `tags` JSON NULL,
  `created_by` INT NOT NULL,
  `updated_by` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  CONSTRAINT `fk_games_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_games_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_games_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE,
  INDEX `idx_games_tenant_type` (`tenant_id`, `type`),
  INDEX `idx_games_tenant_skill` (`tenant_id`, `skill`),
  INDEX `idx_games_title` (`title`(191))
);

-- Assignment practice sessions table
CREATE TABLE IF NOT EXISTS `assignment_practice_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` INT NOT NULL,
  `assignment_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `status` ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL,
  `time_spent_seconds` INT DEFAULT 0,
  `answers` JSON NULL COMMENT 'User answers/responses for quiz-type assignments',
  `score` DECIMAL(5,2) NULL COMMENT 'Score out of 100 if applicable',
  `feedback` TEXT NULL COMMENT 'Teacher feedback if provided',
  `metadata` JSON NULL COMMENT 'Additional session data',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_practice_sessions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_practice_sessions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_practice_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX `idx_practice_sessions_tenant_user` (`tenant_id`, `user_id`),
  INDEX `idx_practice_sessions_assignment` (`assignment_id`),
  INDEX `idx_practice_sessions_status` (`status`),
  INDEX `idx_practice_sessions_started` (`started_at`)
);

