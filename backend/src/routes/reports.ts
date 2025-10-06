import express from 'express';
import { query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/reports/kct/coverage - CEFR coverage matrix
router.get('/kct/coverage', [
  authenticate,
  query('framework_id').optional().isInt(),
  query('version_id').optional().isInt(),
  query('campus_id').optional().isInt()
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { framework_id, version_id, campus_id } = req.query;

  // Get CEFR coverage data
  const coverageQuery = `
    SELECT
      cf.name as framework_name,
      cfv.version_no,
      JSON_OBJECT(
        'listening', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Listening"')), 0),
        'speaking', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Speaking"')), 0),
        'reading', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Reading"')), 0),
        'writing', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Writing"')), 0),
        'grammar', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Grammar"')), 0),
        'vocabulary', COALESCE(SUM(JSON_EXTRACT(ub.skills, '$."Vocabulary"')), 0)
      ) as skill_coverage,
      AVG(ub.completeness_score) as avg_completeness,
      COUNT(DISTINCT ub.id) as total_units,
      COUNT(DISTINCT cb.id) as total_courses
    FROM curriculum_frameworks cf
    INNER JOIN curriculum_framework_versions cfv ON cf.latest_version_id = cfv.id
    INNER JOIN course_blueprints cb ON cfv.id = cb.version_id
    INNER JOIN unit_blueprints ub ON cb.id = ub.course_blueprint_id
    WHERE cf.tenant_id = ?
    ${framework_id ? 'AND cf.id = ?' : ''}
    ${version_id ? 'AND cfv.id = ?' : ''}
    GROUP BY cf.id, cfv.id
  `;

  const params = [user.tenantId];
  if (framework_id) params.push(framework_id);
  if (version_id) params.push(version_id);

  const [coverage] = await config.query(coverageQuery, params);

  res.json({
    coverage_matrix: coverage,
    generated_at: new Date().toISOString()
  });
}));

// GET /api/v1/reports/kct/approval-time - Approval timeline analytics
router.get('/kct/approval-time', [
  authenticate,
  query('days').optional().isInt({ min: 7, max: 365 }),
  query('framework_id').optional().isInt()
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { days = 90, framework_id } = req.query;

  const timelineQuery = `
    SELECT
      cf.name as framework_name,
      cfv.version_no,
      cfv.created_at as submitted_at,
      cfv.approved_at,
      TIMESTAMPDIFF(HOUR, cfv.created_at, cfv.approved_at) as approval_hours,
      TIMESTAMPDIFF(DAY, cfv.created_at, cfv.approved_at) as approval_days,
      a.decision_made_by,
      u.full_name as approver_name
    FROM curriculum_framework_versions cfv
    INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
    LEFT JOIN approvals a ON cfv.id = a.version_id AND a.status = 'approved'
    LEFT JOIN users u ON a.decision_made_by = u.id
    WHERE cf.tenant_id = ?
      AND cfv.state = 'approved'
      AND cfv.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ${framework_id ? 'AND cf.id = ?' : ''}
    ORDER BY cfv.created_at DESC
  `;

  const params = [user.tenantId, days];
  if (framework_id) params.push(framework_id);

  const [timeline] = await config.query(timelineQuery, params);

  // Calculate averages
  const avgHours = timeline.reduce((sum, item) => sum + (item.approval_hours || 0), 0) / timeline.length;
  const avgDays = timeline.reduce((sum, item) => sum + (item.approval_days || 0), 0) / timeline.length;

  res.json({
    approval_timeline: timeline,
    summary: {
      total_approvals: timeline.length,
      avg_approval_time_hours: Math.round(avgHours * 10) / 10,
      avg_approval_time_days: Math.round(avgDays * 10) / 10,
      period_days: days
    },
    generated_at: new Date().toISOString()
  });
}));

// GET /api/v1/reports/kct/cefr-matrix - CEFR compliance matrix
router.get('/kct/cefr-matrix', [
  authenticate,
  query('framework_id').optional().isInt(),
  query('level').optional().isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { framework_id, level } = req.query;

  const matrixQuery = `
    SELECT
      cf.name as framework_name,
      cf.target_level,
      JSON_OBJECT(
        'A1', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%A1%' THEN 1 ELSE 0 END), 'total', COUNT(*)),
        'A2', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%A2%' THEN 1 ELSE 0 END), 'total', COUNT(*)),
        'B1', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%B1%' THEN 1 ELSE 0 END), 'total', COUNT(*)),
        'B2', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%B2%' THEN 1 ELSE 0 END), 'total', COUNT(*)),
        'C1', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%C1%' THEN 1 ELSE 0 END), 'total', COUNT(*)),
        'C2', JSON_OBJECT('covered', SUM(CASE WHEN cf.target_level LIKE '%C2%' THEN 1 ELSE 0 END), 'total', COUNT(*))
      ) as cefr_coverage
    FROM curriculum_frameworks cf
    WHERE cf.tenant_id = ?
    ${framework_id ? 'AND cf.id = ?' : ''}
    GROUP BY cf.id
  `;

  const params = [user.tenantId];
  if (framework_id) params.push(framework_id);

  const [matrix] = await config.query(matrixQuery, params);

  res.json({
    cefr_matrix: matrix,
    compliance_threshold: 80, // 80% coverage required
    generated_at: new Date().toISOString()
  });
}));

// GET /api/v1/reports/kct/impact - Curriculum impact analysis
router.get('/kct/impact', [
  authenticate,
  query('framework_id').optional().isInt(),
  query('months').optional().isInt({ min: 1, max: 24 })
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { framework_id, months = 6 } = req.query;

  // Get deployment and usage data
  const impactQuery = `
    SELECT
      cf.name as framework_name,
      COUNT(DISTINCT kd.id) as deployments,
      COUNT(DISTINCT kd.target_id) as active_classes,
      AVG(kt.completion_rate) as avg_completion_rate,
      AVG(kt.engagement_score) as avg_engagement,
      SUM(kt.total_students) as total_students_impacted,
      MAX(kd.deployed_at) as last_deployment
    FROM curriculum_frameworks cf
    LEFT JOIN kct_mappings km ON cf.id = km.framework_id AND km.status = 'applied'
    LEFT JOIN kct_deployments kd ON km.id = kd.mapping_id AND kd.deployment_status = 'active'
    LEFT JOIN kct_usage_tracking kt ON kd.id = kt.deployment_id
      AND kt.tracked_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
    WHERE cf.tenant_id = ?
    ${framework_id ? 'AND cf.id = ?' : ''}
    GROUP BY cf.id
  `;

  const params = [months, user.tenantId];
  if (framework_id) params.push(framework_id);

  const [impact] = await config.query(impactQuery, params);

  res.json({
    impact_analysis: impact,
    analysis_period_months: months,
    key_metrics: {
      total_deployments: impact.reduce((sum, item) => sum + item.deployments, 0),
      total_students_impacted: impact.reduce((sum, item) => sum + (item.total_students_impacted || 0), 0),
      avg_completion_rate: impact.reduce((sum, item) => sum + (item.avg_completion_rate || 0), 0) / impact.length,
      avg_engagement_score: impact.reduce((sum, item) => sum + (item.avg_engagement || 0), 0) / impact.length
    },
    generated_at: new Date().toISOString()
  });
}));

// GET /api/v1/reports/kct/adoption - Framework adoption rates
router.get('/kct/adoption', [
  authenticate,
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const { period = 'month' } = req.query;

  const periodMap = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  };

  const days = periodMap[period];

  const adoptionQuery = `
    SELECT
      DATE_FORMAT(kd.deployed_at, '%Y-%m-%d') as date,
      COUNT(DISTINCT kd.id) as new_deployments,
      COUNT(DISTINCT kd.target_id) as active_instances,
      cf.name as framework_name
    FROM kct_deployments kd
    INNER JOIN kct_mappings km ON kd.mapping_id = km.id
    INNER JOIN curriculum_frameworks cf ON km.framework_id = cf.id
    WHERE kd.deployed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND cf.tenant_id = ?
    GROUP BY DATE(kd.deployed_at), cf.id
    ORDER BY date ASC
  `;

  const [adoption] = await config.query(adoptionQuery, [days, user.tenantId]);

  res.json({
    adoption_trends: adoption,
    period,
    period_days: days,
    summary: {
      total_deployments: adoption.reduce((sum, item) => sum + item.new_deployments, 0),
      avg_daily_deployments: Math.round((adoption.reduce((sum, item) => sum + item.new_deployments, 0) / days) * 10) / 10,
      peak_day: adoption.reduce((max, item) => item.new_deployments > max.new_deployments ? item : max, adoption[0])
    },
    generated_at: new Date().toISOString()
  });
}));

export default router;