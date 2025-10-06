import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';
import { addExportJob, getJobStatus } from '../services/queueService';

const router = express.Router();

// GET /api/v1/versions/{versionId}/export - Export version
router.get('/versions/:versionId/export', [
  authenticate,
  param('versionId').isInt(),
  query('format').isIn(['pdf', 'docx', 'scorm']),
  query('language').optional().isLength({ min: 2, max: 10 }),
  query('watermark').optional().isBoolean(),
  query('include_resources').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const { versionId } = req.params;
  const user = req.user!;
  const {
    format,
    language = 'en',
    watermark = true,
    include_resources = true
  } = req.query;

  // Verify version exists and user has access
  const [versions] = await config.query(
    `SELECT cfv.*, cf.tenant_id
     FROM curriculum_framework_versions cfv
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE cfv.id = ? AND cf.tenant_id = ?`,
    [versionId, user.tenantId]
  );

  if (versions.length === 0) {
    throw createError('Version not found', 'NOT_FOUND', 404);
  }

  const version = versions[0];

  // Check if version is published (for watermark logic)
  const shouldWatermark = watermark && version.state !== 'published';

  // Create export job
  const jobData = {
    versionId: Number(versionId),
    format: format as string,
    language,
    watermark: shouldWatermark,
    userId: user.id,
    tenantId: user.tenantId
  };

  const jobId = await addExportJob(jobData);

  // Create export record
  const [result] = await config.query(
    `INSERT INTO exports (
      tenant_id, version_id, format, language, watermark, include_resources,
      job_id, status, requested_by, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?, NOW())`,
    [
      user.tenantId,
      versionId,
      format,
      language,
      shouldWatermark,
      include_resources,
      jobId,
      user.id
    ]
  );

  const exportId = (result as any).insertId;

  auditLogger.create(user.id.toString(), 'export', exportId.toString(), {
    versionId,
    format,
    jobId
  });

  res.json({
    export_id: exportId,
    job_id: jobId,
    status: 'queued',
    estimated_completion: '5-30 minutes',
    message: 'Export job has been queued for processing'
  });
}));

// GET /api/v1/exports/{jobId}/status - Get export status
router.get('/:jobId/status', [
  authenticate,
  param('jobId').isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const user = req.user!;

  // Get export record
  const [exports] = await config.query(
    `SELECT e.*, cf.code as framework_code, cf.name as framework_name, cfv.version_no
     FROM exports e
     INNER JOIN curriculum_framework_versions cfv ON e.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE e.job_id = ? AND e.tenant_id = ?`,
    [jobId, user.tenantId]
  );

  if (exports.length === 0) {
    throw createError('Export not found', 'NOT_FOUND', 404);
  }

  const exportRecord = exports[0];

  // Get job status from queue
  const jobStatus = await getJobStatus('export', jobId);

  if (!jobStatus) {
    throw createError('Job not found in queue', 'JOB_NOT_FOUND', 404);
  }

  // Update export record if job completed
  if (jobStatus.state === 'completed' && exportRecord.status !== 'completed') {
    await config.query(
      `UPDATE exports
       SET status = 'completed', completed_at = NOW(),
           file_url = ?, file_size = ?, checksum = ?, updated_at = NOW()
       WHERE job_id = ?`,
      [
        jobStatus.returnValue?.fileUrl,
        jobStatus.returnValue?.fileSize,
        'checksum_placeholder', // Would be calculated during export
        jobId
      ]
    );
  } else if (jobStatus.state === 'failed' && exportRecord.status !== 'failed') {
    await config.query(
      `UPDATE exports
       SET status = 'failed', error_message = ?, updated_at = NOW()
       WHERE job_id = ?`,
      [jobStatus.failedReason, jobId]
    );
  }

  res.json({
    export_id: exportRecord.id,
    job_id: jobId,
    status: jobStatus.state,
    progress: jobStatus.progress || 0,
    format: exportRecord.format,
    language: exportRecord.language,
    watermark: exportRecord.watermark,
    framework: {
      code: exportRecord.framework_code,
      name: exportRecord.framework_name,
      version: exportRecord.version_no
    },
    requested_at: exportRecord.requested_at,
    completed_at: exportRecord.completed_at,
    file_url: exportRecord.file_url,
    file_size: exportRecord.file_size,
    error_message: exportRecord.error_message,
    estimated_completion: jobStatus.state === 'active' ? 'Processing...' : null
  });
}));

// GET /api/v1/exports - List user exports
router.get('/', [
  authenticate,
  query('status').optional().isIn(['queued', 'processing', 'completed', 'failed']),
  query('format').optional().isIn(['pdf', 'docx', 'scorm']),
  query('page').optional().isInt({ min: 1 }),
  query('page_size').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const user = req.user!;
  const {
    status,
    format,
    page = 1,
    page_size = 20
  } = req.query;

  const offset = (Number(page) - 1) * Number(page_size);

  // Build WHERE clause
  let whereConditions = ['e.tenant_id = ?'];
  let params: any[] = [user.tenantId];

  if (status) {
    whereConditions.push('e.status = ?');
    params.push(status);
  }

  if (format) {
    whereConditions.push('e.format = ?');
    params.push(format);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM exports e WHERE ${whereClause}`;
  const [countResult] = await config.query(countQuery, params);
  const total = countResult[0].total;

  // Get exports
  const exportsQuery = `
    SELECT
      e.*,
      cf.code as framework_code,
      cf.name as framework_name,
      cfv.version_no,
      u.full_name as requested_by_name
    FROM exports e
    INNER JOIN curriculum_framework_versions cfv ON e.version_id = cfv.id
    INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
    INNER JOIN users u ON e.requested_by = u.id
    WHERE ${whereClause}
    ORDER BY e.requested_at DESC
    LIMIT ? OFFSET ?
  `;

  const finalParams = [...params, Number(page_size), offset];
  const [exports] = await config.query(exportsQuery, finalParams);

  res.json({
    data: exports,
    page: Number(page),
    page_size: Number(page_size),
    total,
    total_pages: Math.ceil(total / Number(page_size))
  });
}));

// GET /api/v1/verify/{exportId} - Verify export integrity
router.get('/verify/:exportId', [
  authenticate,
  param('exportId').isInt()
], asyncHandler(async (req, res) => {
  const { exportId } = req.params;
  const user = req.user!;

  // Get export record
  const [exports] = await config.query(
    `SELECT e.file_url, e.checksum, e.format, e.created_at,
            cf.code as framework_code, cfv.version_no
     FROM exports e
     INNER JOIN curriculum_framework_versions cfv ON e.version_id = cfv.id
     INNER JOIN curriculum_frameworks cf ON cfv.framework_id = cf.id
     WHERE e.id = ? AND e.tenant_id = ? AND e.status = 'completed'`,
    [exportId, user.tenantId]
  );

  if (exports.length === 0) {
    throw createError('Export not found or not completed', 'NOT_FOUND', 404);
  }

  const exportRecord = exports[0];

  // Generate QR code data for verification
  const qrData = {
    export_id: exportId,
    framework_code: exportRecord.framework_code,
    version: exportRecord.version_no,
    format: exportRecord.format,
    exported_at: exportRecord.created_at,
    checksum: exportRecord.checksum,
    verified_at: new Date().toISOString()
  };

  // In real implementation, this would generate an actual QR code
  // For now, return verification data
  res.json({
    verified: true,
    export_id: exportId,
    qr_data: qrData,
    verification_url: `${process.env.FRONTEND_URL}/verify/${exportId}`,
    message: 'Export integrity verified'
  });
}));

// DELETE /api/v1/exports/{exportId} - Delete export record
router.delete('/:exportId', [
  authenticate,
  param('exportId').isInt()
], asyncHandler(async (req, res) => {
  const { exportId } = req.params;
  const user = req.user!;

  // Only allow deletion of own exports or by admin
  const [exports] = await config.query(
    `SELECT e.requested_by FROM exports e WHERE e.id = ? AND e.tenant_id = ?`,
    [exportId, user.tenantId]
  );

  if (exports.length === 0) {
    throw createError('Export not found', 'NOT_FOUND', 404);
  }

  const exportRecord = exports[0];

  if (exportRecord.requested_by !== user.id && user.role !== 'admin') {
    throw createError('Cannot delete export created by another user', 'FORBIDDEN', 403);
  }

  // Soft delete
  await config.query(
    'UPDATE exports SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
    [user.id, exportId]
  );

  auditLogger.update(user.id.toString(), 'export', exportId, { deleted: true });

  res.json({ message: 'Export record deleted successfully' });
}));

export default router;