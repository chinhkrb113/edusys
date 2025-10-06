SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- Helper: sequence table without CTE (avoids client issues)
-- =========================================================
DROP TABLE IF EXISTS _seq;
CREATE TABLE _seq (n INT PRIMARY KEY);
INSERT INTO _seq (n) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
(31),(32),(33),(34),(35),(36),(37),(38),(39),(40),
(41),(42),(43),(44),(45),(46),(47),(48),(49),(50),
(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),
(61),(62),(63),(64),(65),(66),(67),(68),(69),(70),
(71),(72),(73),(74),(75),(76),(77),(78),(79),(80),
(81),(82),(83),(84),(85),(86),(87),(88),(89),(90),
(91),(92),(93),(94),(95),(96),(97),(98),(99),(100),
(101),(102),(103),(104),(105),(106),(107),(108),(109),(110),
(111),(112),(113),(114),(115),(116),(117),(118),(119),(120),
(121),(122),(123),(124),(125),(126),(127),(128),(129),(130),
(131),(132),(133),(134),(135),(136),(137),(138),(139),(140),
(141),(142),(143),(144),(145),(146),(147),(148),(149),(150),
(151),(152),(153),(154),(155),(156),(157),(158),(159),(160),
(161),(162),(163),(164),(165),(166),(167),(168),(169),(170),
(171),(172),(173),(174),(175),(176),(177),(178),(179),(180),
(181),(182),(183),(184),(185),(186),(187),(188),(189),(190),
(191),(192),(193),(194),(195),(196),(197),(198),(199),(200),
(201),(202),(203),(204),(205),(206),(207),(208),(209),(210),
(211),(212),(213),(214),(215),(216),(217),(218),(219),(220),
(221),(222),(223),(224),(225),(226),(227),(228),(229),(230),
(231),(232),(233),(234),(235),(236),(237),(238),(239),(240);

-- ======================
-- 1) TENANTS (25 rows)
-- ======================
INSERT INTO tenants (code, name, domain, is_active, settings, created_at, updated_at)
SELECT
  CONCAT('TEN', LPAD(n,3,'0')),
  CONCAT('Tenant ', LPAD(n,2,'0')),
  CONCAT('tenant', n, '.example.com'),
  1,
  JSON_OBJECT('theme','light','tz','Asia/Bangkok'),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25;

-- =======================
-- 2) CAMPUSES (25 rows)
-- =======================
INSERT INTO campuses (tenant_id, code, name, address, contact_email, contact_phone, is_active, settings, created_at, updated_at)
SELECT
  n,                                      -- tenant_id = n
  CONCAT('C', LPAD(n,2,'0')),
  CONCAT('Campus ', n),
  CONCAT(n, ' Main St, City'),
  CONCAT('campus', n, '@tenant', n, '.example.com'),
  CONCAT('09', LPAD(n,8,'0')),
  1,
  JSON_OBJECT('brand', CONCAT('campus-', n)),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25;

-- ===================
-- 3) USERS (50 rows)
-- ===================
INSERT INTO users (tenant_id, email, full_name, role, campus_id, is_active, preferences, created_at, updated_at)
SELECT
  ((n-1)%25)+1,
  CONCAT('user', n, '@tenant', ((n-1)%25)+1, '.example.com'),
  CONCAT('User ', n),
  ELT((n % 8)+1, 'super_admin','admin','bgh','program_owner','curriculum_designer','teacher','qa','viewer'),
  ((n-1)%25)+1,
  1,
  JSON_OBJECT('lang','vi','density','compact'),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 50;

-- ====================================
-- 4) CURRICULUM FRAMEWORKS (25 rows)
-- ====================================
INSERT INTO curriculum_frameworks
(tenant_id, campus_id, code, name, language, target_level, age_group, total_hours, status, owner_user_id,
 description, learning_objectives, prerequisites, assessment_strategy,
 created_by, updated_by, created_at, updated_at)
SELECT
  n,                                     -- tenant_id
  n,                                     -- campus_id
  CONCAT('FW', LPAD(n,3,'0')),
  CONCAT('Framework ', n),
  ELT((n % 6)+1, 'en','vi','jp','kr','fr','en'),
  ELT((n % 6)+1, 'A1','A2','B1','B2','C1','C2'),
  ELT((n % 4)+1, 'kids','teens','adults','all'),
  40 + (n * 5),
  ELT((n % 5)+1, 'draft','pending_review','approved','published','archived'),
  ((n-1)%50)+1,                          -- owner_user_id (1..50)
  CONCAT('Description for framework ', n),
  JSON_ARRAY(CONCAT('Objective ', n, '-1'), CONCAT('Objective ', n, '-2')),
  JSON_ARRAY('Basic phonics','Alphabet'),
  'Periodic quizzes and final assessment',
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25;

-- =============================================
-- 5) CURRICULUM FRAMEWORK VERSIONS (50 rows)
--    - 2 versions per framework: v1.0 & v1.1
-- =============================================
-- First 25 rows: v1.0
INSERT INTO curriculum_framework_versions
(framework_id, version_no, state, is_frozen, changelog, review_deadline, published_at, metadata, created_by, updated_by, created_at, updated_at)
SELECT
  n,
  'v1.0',
  ELT((n % 5)+1, 'draft','pending_review','approved','published','archived'),
  IF((n % 5)=1,1,0),
  CONCAT('Changelog v1.0 for framework ', n),
  NULL,
  IF((n % 4)=0, NOW(), NULL),
  JSON_OBJECT('note', CONCAT('v1.0 meta ', n)),
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25;

-- Next 25 rows: v1.1  (framework_id = 1..25 again)
INSERT INTO curriculum_framework_versions
(framework_id, version_no, state, is_frozen, changelog, review_deadline, published_at, metadata, created_by, updated_by, created_at, updated_at)
SELECT
  n,
  'v1.1',
  ELT((n % 5)+1, 'draft','pending_review','approved','published','archived'),
  IF((n % 5)=2,1,0),
  CONCAT('Changelog v1.1 for framework ', n),
  NULL,
  IF((n % 4)=1, NOW(), NULL),
  JSON_OBJECT('note', CONCAT('v1.1 meta ', n)),
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25;

-- ================================
-- 6) COURSE BLUEPRINTS (100 rows)
--    map 2 courses per version (50*2)
-- ================================
-- courses #1..50 (1 per version)
INSERT INTO course_blueprints
(version_id, code, title, subtitle, level, hours, order_index, summary, learning_outcomes, assessment_types, prerequisites, created_by, updated_by, created_at, updated_at)
SELECT
  n,                                      -- version_id 1..50
  CONCAT('C', LPAD(n,3,'0'), '-A'),
  CONCAT('Course ', n, 'A'),
  CONCAT('Sub ', n, 'A'),
  ELT((n % 6)+1, 'A1','A2','B1','B2','C1','C2'),
  15 + (n % 10),
  (n*2)-1,
  CONCAT('Summary course ', n, 'A'),
  JSON_ARRAY(CONCAT('LO',n,'A-1'), CONCAT('LO',n,'A-2')),
  JSON_ARRAY('quiz','project'),
  'Basic prerequisites',
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 50;

-- courses #51..100 (second course per version)
INSERT INTO course_blueprints
(version_id, code, title, subtitle, level, hours, order_index, summary, learning_outcomes, assessment_types, prerequisites, created_by, updated_by, created_at, updated_at)
SELECT
  n,                                      -- version_id 1..50
  CONCAT('C', LPAD(n,3,'0'), '-B'),
  CONCAT('Course ', n, 'B'),
  CONCAT('Sub ', n, 'B'),
  ELT((n % 6)+1, 'A1','A2','B1','B2','C1','C2'),
  16 + (n % 10),
  (n*2),
  CONCAT('Summary course ', n, 'B'),
  JSON_ARRAY(CONCAT('LO',n,'B-1'), CONCAT('LO',n,'B-2')),
  JSON_ARRAY('quiz','project'),
  'Basic prerequisites',
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 50;

-- ===============================
-- 7) UNIT BLUEPRINTS (120 rows)
--    distribute across 100 courses
-- ===============================
INSERT INTO unit_blueprints
(course_blueprint_id, title, subtitle, objectives, skills, activities, rubric, homework, hours, order_index, difficulty_level, estimated_time, notes, ai_generated, ai_confidence, created_by, updated_by, created_at, updated_at)
SELECT
  ((n-1)%100)+1,                           -- 1..100 cycle
  CONCAT('Unit ', n),
  CONCAT('Unit sub ', n),
  JSON_ARRAY(CONCAT('Can do ', n, '.1'), CONCAT('Can do ', n, '.2')),
  JSON_ARRAY('listening','speaking','reading','writing'),
  JSON_ARRAY(JSON_OBJECT('type','warmup','mins',10), JSON_OBJECT('type','practice','mins',30)),
  JSON_OBJECT('criteria', JSON_ARRAY('accuracy','fluency'), 'scale', JSON_ARRAY(1,2,3,4,5)),
  JSON_ARRAY(CONCAT('HW ', n)),
  2 + (n % 4),
  n,
  ELT((n % 3)+1,'beginner','intermediate','advanced'),
  90,
  CONCAT('Notes for unit ', n),
  IF((n % 2)=0,1,0),
  0.6,
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 120;

-- ==================================
-- 8) UNIT RESOURCES (240 rows)
--    2 resources per unit (first 120)
-- ==================================
-- R1 per unit
INSERT INTO unit_resources
(unit_id, kind, title, description, url, file_path, file_size, mime_type, ocr_text, ai_tags, manual_tags, license_type, license_note, accessibility_features, health_status, last_health_check, order_index, is_required, download_count, created_by, updated_by, created_at, updated_at)
SELECT
  n,
  ELT((n % 9)+1,'pdf','slide','video','audio','link','doc','image','worksheet','interactive'),
  CONCAT('Resource ', n, ' R1'),
  CONCAT('Res desc ', n, ' R1'),
  CONCAT('https://cdn.example.com/res/', n, '/r1'),
  CONCAT('/files/res_', n, '_1.bin'),
  1024 * n,
  'application/octet-stream',
  CONCAT('Extracted OCR text for resource ', n, ' R1'),
  JSON_OBJECT('skill','listening','level', ELT((n%6)+1,'A1','A2','B1','B2','C1','C2'),'topic','travel','confidence',0.9),
  JSON_ARRAY('tagA','tagB'),
  'CC-BY',
  'Internal use only',
  JSON_OBJECT('captions', TRUE, 'alt', CONCAT('Alt ', n)),
  ELT((n % 5)+1,'healthy','broken','expired','restricted','unknown'),
  NOW(),
  1, IF((n%3)=0,1,0), FLOOR(100 + n),
  ((n-1)%50)+1, ((n-1)%50)+1, NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 120;

-- R2 per unit
INSERT INTO unit_resources
(unit_id, kind, title, description, url, file_path, file_size, mime_type, ocr_text, ai_tags, manual_tags, license_type, license_note, accessibility_features, health_status, last_health_check, order_index, is_required, download_count, created_by, updated_by, created_at, updated_at)
SELECT
  n,
  ELT(((n+1) % 9)+1,'pdf','slide','video','audio','link','doc','image','worksheet','interactive'),
  CONCAT('Resource ', n, ' R2'),
  CONCAT('Res desc ', n, ' R2'),
  CONCAT('https://cdn.example.com/res/', n, '/r2'),
  CONCAT('/files/res_', n, '_2.bin'),
  2048 * n,
  'application/octet-stream',
  CONCAT('Extracted OCR text for resource ', n, ' R2'),
  JSON_OBJECT('skill','speaking','level', ELT(((n+1)%6)+1,'A1','A2','B1','B2','C1','C2'),'topic','school','confidence',0.85),
  JSON_ARRAY('tagC'),
  'CC-BY',
  'Internal use only',
  JSON_OBJECT('captions', TRUE, 'alt', CONCAT('Alt2 ', n)),
  ELT(((n+1) % 5)+1,'healthy','broken','expired','restricted','unknown'),
  NOW(),
  2, IF((n%4)=0,1,0), FLOOR(150 + n),
  ((n-1)%50)+1, ((n-1)%50)+1, NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 120;

-- =======================
-- 9) KCT MAPPINGS (40+)
-- =======================
INSERT INTO kct_mappings
(framework_id, version_id, target_type, target_id, campus_id, rollout_batch, rollout_phase, mismatch_report, risk_assessment, override_reason, status, applied_at, created_by, updated_by, created_at, updated_at)
SELECT
  ((n-1)%25)+1,            -- framework_id 1..25
  ((n-1)%50)+1,            -- version_id 1..50
  ELT((n % 2)+1, 'course_template','class_instance'),
  1000 + n,
  ((n-1)%25)+1,
  CONCAT('batch-', CEIL(n/10)),
  ELT((n % 4)+1,'planned','pilot','phased','full'),
  JSON_OBJECT('hours_gap', (n%3), 'level_mismatch', MOD(n,2)=0),
  ELT((n % 4)+1,'low','medium','high','critical'),
  IF((n%6)=0,'Policy override',''),
  ELT((n % 5)+1,'planned','validated','applied','failed','rolled_back'),
  IF((n%3)=0,NOW(),NULL),
  ((n-1)%50)+1, ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 40;

-- ===============
-- 10) TAGS (50+)
-- ===============
INSERT INTO tags (tenant_id, name, category, color, description, is_system, usage_count, created_by, created_at, updated_at)
SELECT
  ((n-1)%25)+1,
  CONCAT('tag-', n),
  ELT((n % 3)+1,'skill','topic','level'),
  CONCAT('#', LPAD(HEX(100000 + n), 6, '0')),
  CONCAT('Sample tag ', n),
  IF((n%5)=0,1,0),
  0,
  ((n-1)%50)+1,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 50;

-- ====================================
-- 11) FRAMEWORK TAGS (50 pairs)
-- ====================================
INSERT INTO curriculum_framework_tags (framework_id, tag_id, created_at)
SELECT
  ((n-1)%25)+1,  -- 1..25 cycle
  n,             -- tag_id 1..50
  NOW()
FROM _seq WHERE n BETWEEN 1 AND 50;

-- =================================
-- 12) UNIT TAGS (120 pairs)
-- =================================
INSERT INTO unit_blueprint_tags (unit_id, tag_id, created_at)
SELECT
  n,                          -- unit_id 1..120
  ((n-1)%50)+1,               -- tag_id 1..50 cyclic
  NOW()
FROM _seq WHERE n BETWEEN 1 AND 120;

-- =========================
-- 13) COMMENTS (40 rows)
-- =========================
INSERT INTO comments
(tenant_id, entity_type, entity_id, author_id, parent_id, body, mentions, attachments, is_resolved, resolved_by, resolved_at, edited_at, deleted_at, created_at, updated_at)
SELECT
  ((n-1)%25)+1,
  'framework',
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  NULL,
  CONCAT('This is comment #', n),
  JSON_ARRAY(((n)%50)+1, ((n+1)%50)+1),
  JSON_ARRAY(JSON_OBJECT('name','file.txt','url',CONCAT('https://f/',n))),
  IF((n%4)=0,1,0),
  IF((n%4)=0, ((n+2-1)%50)+1, NULL),
  IF((n%4)=0, NOW(), NULL),
  NULL,
  NULL,
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 40;

-- ==========================
-- 14) APPROVALS (40 rows)
-- ==========================
INSERT INTO approvals
(tenant_id, version_id, requested_by, assigned_reviewer_id, status, priority, review_deadline, decision, decision_made_by, decision_made_at, escalation_reason, escalated_to, escalated_at, created_at, updated_at)
SELECT
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  ((n-1)%50)+1,
  ((n)%50)+1,
  ELT((n % 5)+1,'requested','in_review','approved','rejected','escalated'),
  ELT((n % 4)+1,'low','normal','high','urgent'),
  NOW() + INTERVAL (n%7) DAY,
  IF((n%3)=0,'Looks good',NULL),
  IF((n%3)=0, ((n+5-1)%50)+1, NULL),
  IF((n%3)=0, NOW(), NULL),
  IF((n%5)=0,'Need director',''),
  IF((n%5)=0, ((n+7-1)%50)+1, NULL),
  IF((n%5)=0, NOW(), NULL),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 40;

-- ==========================
-- 15) SAVED VIEWS (30 rows)
-- ==========================
INSERT INTO saved_views
(tenant_id, owner_id, name, view_type, is_shared, is_default, filters, columns, sort_config, layout_config, usage_count, last_used_at, created_at, updated_at)
SELECT
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  CONCAT('View ', n),
  ELT((n % 3)+1,'framework_list','unit_editor','reports'),
  IF((n%4)=0,1,0),
  IF((n%10)=0,1,0),
  JSON_OBJECT('status', ELT((n%5)+1,'draft','pending_review','approved','published','archived')),
  JSON_ARRAY('code','name','status'),
  JSON_OBJECT('by','updated_at','dir','desc'),
  JSON_OBJECT('density','comfortable'),
  10 + (n%20),
  NOW(),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 30;

-- =========================
-- 16) AUDIT LOGS (40 rows)
-- =========================
INSERT INTO audit_logs
(tenant_id, actor_id, session_id, action, entity_type, entity_id, old_values, new_values, metadata, ip_address, user_agent, created_at)
SELECT
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  CONCAT('sess-', LPAD(n,4,'0')),
  ELT((n % 6)+1,'create','update','delete','approve','publish','export'),
  'curriculum_framework',
  ((n-1)%25)+1,
  JSON_OBJECT('status','draft'),
  JSON_OBJECT('status','approved'),
  JSON_OBJECT('trace', CONCAT('trace-', n)),
  '127.0.0.1',
  'demo-agent/1.0',
  NOW()
FROM _seq WHERE n BETWEEN 1 AND 40;

-- ===============================
-- 17) KCT USAGE TRACKING (30 rows)
-- ===============================
INSERT INTO kct_usage_tracking
(tenant_id, framework_id, version_id, target_type, target_id, campus_id, user_id, action, duration_seconds, completion_percentage, metadata, created_at)
SELECT
  ((n-1)%25)+1,
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  ELT((n % 2)+1,'course','class'),
  2000 + n,
  ((n-1)%25)+1,
  ((n-1)%50)+1,
  ELT((n % 5)+1,'view','edit','export','apply','teach'),
  30 + (n*3),
  IF((n%2)=0, 50 + (n%50), NULL),
  JSON_OBJECT('extra','demo'),
  NOW()
FROM _seq WHERE n BETWEEN 1 AND 30;

-- ======================================
-- 18) LEARNING OUTCOMES TRACKING (30 rows)
-- ======================================
INSERT INTO learning_outcomes_tracking
(tenant_id, framework_id, class_id, student_id, unit_id, assessment_type, score, max_score, grade, skills_assessed, feedback, completed_at, metadata, created_at)
SELECT
  ((n-1)%25)+1,
  ((n-1)%25)+1,
  3000 + n,
  4000 + n,
  ((n-1)%120)+1,   -- unit_id existing
  ELT((n % 3)+1,'quiz','exam','project'),
  ROUND(60 + (n*1.5),2),
  100.00,
  ELT((n % 6)+1,'A','A-','B+','B','C+','C'),
  JSON_ARRAY('listening','speaking'),
  CONCAT('Feedback ', n),
  NOW() - INTERVAL (n%10) DAY,
  JSON_OBJECT('cohort','2025S1'),
  NOW()
FROM _seq WHERE n BETWEEN 1 AND 30;

-- =====================
-- 19) SETTINGS (25 rows)
-- =====================
INSERT INTO settings
(tenant_id, hours_tolerance, draft_export_watermark, required_skills_by_level, cefr_minima, max_draft_age_days, require_qr_for_published_exports, allow_override_with_justification, default_campus_branding, ai_generation_enabled, auto_health_checks_enabled, webhook_endpoints, created_at, updated_at)
SELECT
  n,
  0.5,
  1,
  '{"A1":["listening","speaking"],"A2":["listening","speaking","reading"],"B1":["listening","speaking","reading","writing"]}',
  '{"A1":{"min_units":3,"min_skills":2},"A2":{"min_units":4,"min_skills":3}}',
  30,
  1,
  1,
  JSON_OBJECT('logo', CONCAT('logo-', n)),
  1, 1,
  JSON_ARRAY(CONCAT('https://webhook.example.com/tenant/', n)),
  NOW(), NOW()
FROM _seq WHERE n BETWEEN 1 AND 25
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);

-- Optional: clean helper
DROP TABLE IF EXISTS _seq;

SET FOREIGN_KEY_CHECKS = 1;
