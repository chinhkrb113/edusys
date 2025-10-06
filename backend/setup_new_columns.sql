-- ===========================================
-- SETUP NEW COLUMNS FOR CURRICULUM_FRAMEWORKS
-- Thực hiện thêm 4 trường mới: Tổng số buổi học, thời gian học/buổi, cách thức học, hình thức học
-- Database: edusys_ai_2025_v1 (Host: 45.32.100.86)
-- ===========================================

-- Chọn database trước
USE `edusys_ai_2025_v1`;

-- ===========================================
-- THÊM CỘT MỚI (idempotent - an toàn chạy nhiều lần)
-- ===========================================

-- 1. Tổng số buổi học
ALTER TABLE `curriculum_frameworks`
ADD COLUMN IF NOT EXISTS `total_sessions` INT UNSIGNED DEFAULT 0 COMMENT 'Tổng số buổi học (số buổi trong khoá học)';

-- 2. Thời gian học mỗi buổi (giờ)
ALTER TABLE `curriculum_frameworks`
ADD COLUMN IF NOT EXISTS `session_duration_hours` DECIMAL(3, 1) DEFAULT NULL COMMENT 'Thời gian học mỗi buổi (theo giờ, ví dụ: 1.5 = 1 giờ 30 phút)';

-- 3. Cách thức học
ALTER TABLE `curriculum_frameworks`
ADD COLUMN IF NOT EXISTS `learning_method` VARCHAR(128) DEFAULT NULL COMMENT 'Cách thức học: tự học, hướng dẫn, theo dự án, thực hành, tập trung v.v.';

-- 4. Hình thức học
ALTER TABLE `curriculum_frameworks`
ADD COLUMN IF NOT EXISTS `learning_format` VARCHAR(128) DEFAULT NULL COMMENT 'Hình thức học: trực tuyến, trực tiếp, kết hợp, hybrid v.v.';

-- ===========================================
-- THÊM INDEX TỐI ƯU (không cần thiết nhưng tăng hiệu năng)
-- ===========================================

ALTER TABLE `curriculum_frameworks`
ADD INDEX IF NOT EXISTS `idx_learning_method` (`learning_method`),
ADD INDEX IF NOT EXISTS `idx_learning_format` (`learning_format`),
ADD INDEX IF NOT EXISTS `idx_total_sessions` (`total_sessions`),
ADD INDEX IF NOT EXISTS `idx_session_duration` (`session_duration_hours`);

-- ===========================================
-- VERIFY MIGRATION - Kiểm tra kết quả
-- ===========================================

-- Thông báo thành công
SELECT '✅ MIGRATION COMPLETED: 4 trường mới đã được thêm thành công!' AS status;

-- Hiển thị cấu trúc bảng mới
DESCRIBE `curriculum_frameworks`;

-- Hiển thị sample data (nếu có)
SELECT
    id,
    code,
    name,
    total_sessions,
    session_duration_hours,
    learning_method,
    learning_format
FROM curriculum_frameworks
ORDER BY id
LIMIT 10;

COMMIT;