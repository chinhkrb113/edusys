import { apiClient } from '../lib/api';

// Types
export interface ExportJob {
  export_id: number;
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  format: 'pdf' | 'docx' | 'scorm';
  language: string;
  watermark: boolean;
  framework: {
    code: string;
    name: string;
    version: string;
  };
  requested_at: string;
  completed_at?: string;
  file_url?: string;
  file_size?: number;
  error_message?: string;
  estimated_completion: string;
}

export interface ExportRequest {
  format: 'pdf' | 'docx' | 'scorm';
  language?: string;
  watermark?: boolean;
  include_resources?: boolean;
}

export interface ExportRecord {
  id: number;
  version_id: number;
  format: string;
  language: string;
  watermark: boolean;
  include_resources: boolean;
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  requested_by: number;
  requested_at: string;
  completed_at?: string;
  file_url?: string;
  file_size?: number;
  checksum?: string;
  error_message?: string;
}

class ExportService {
  // Start export job
  async startExport(versionId: number, options: ExportRequest): Promise<{
    export_id: number;
    job_id: string;
    status: string;
    estimated_completion: string;
    message: string;
  }> {
    return apiClient.get(`/versions/${versionId}/export`, {
      format: options.format,
      language: options.language || 'en',
      watermark: options.watermark?.toString() || 'true',
      include_resources: options.include_resources?.toString() || 'true',
    });
  }

  // Get export status
  async getExportStatus(jobId: string): Promise<ExportJob> {
    return apiClient.get<ExportJob>(`/${jobId}/status`);
  }

  // List user exports
  async getUserExports(params?: {
    status?: 'queued' | 'processing' | 'completed' | 'failed';
    format?: 'pdf' | 'docx' | 'scorm';
    page?: number;
    page_size?: number;
  }): Promise<{
    data: ExportRecord[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.format) queryParams.format = params.format;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get('/exports', queryParams);
  }

  // Verify export integrity
  async verifyExport(exportId: number): Promise<{
    verified: boolean;
    export_id: number;
    qr_data: Record<string, unknown>;
    verification_url: string;
    message: string;
  }> {
    return apiClient.get(`/verify/${exportId}`);
  }

  // Delete export record
  async deleteExport(exportId: number): Promise<void> {
    return apiClient.delete(`/exports/${exportId}`);
  }

  // Download export file
  async downloadExport(exportId: number): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/exports/${exportId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // Get export templates
  async getExportTemplates(): Promise<Array<{
    id: string;
    name: string;
    format: 'pdf' | 'docx' | 'scorm';
    description: string;
    default_options: ExportRequest;
  }>> {
    return apiClient.get('/exports/templates');
  }

  // Create export from template
  async createFromTemplate(versionId: number, templateId: string, customizations?: Partial<ExportRequest>): Promise<{
    export_id: number;
    job_id: string;
    status: string;
    estimated_completion: string;
  }> {
    return apiClient.post(`/versions/${versionId}/export/from-template`, {
      template_id: templateId,
      customizations,
    });
  }

  // Get export statistics
  async getExportStats(params?: {
    date_from?: string;
    date_to?: string;
    format?: 'pdf' | 'docx' | 'scorm';
  }): Promise<{
    total_exports: number;
    successful_exports: number;
    failed_exports: number;
    avg_processing_time: number;
    by_format: Record<string, number>;
    by_status: Record<string, number>;
    popular_versions: Array<{
      version_id: number;
      framework_name: string;
      export_count: number;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.format) queryParams.format = params.format;

    return apiClient.get('/exports/stats', queryParams);
  }

  // Bulk export versions
  async bulkExport(versions: Array<{
    version_id: number;
    options: ExportRequest;
  }>): Promise<{
    jobs: Array<{
      version_id: number;
      export_id: number;
      job_id: string;
    }>;
    failed: Array<{
      version_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/exports/bulk', { versions });
  }

  // Get export queue status
  async getQueueStatus(): Promise<{
    active_jobs: number;
    queued_jobs: number;
    completed_today: number;
    failed_today: number;
    avg_processing_time: number;
    queue_health: 'healthy' | 'warning' | 'critical';
  }> {
    return apiClient.get('/exports/queue-status');
  }

  // Retry failed export
  async retryExport(exportId: number): Promise<{
    export_id: number;
    new_job_id: string;
    status: string;
  }> {
    return apiClient.post(`/exports/${exportId}/retry`);
  }

  // Get export preview
  async getExportPreview(versionId: number, options: ExportRequest): Promise<{
    preview_url: string;
    estimated_size: number;
    estimated_pages: number;
    content_summary: {
      courses: number;
      units: number;
      resources: number;
      total_hours: number;
    };
  }> {
    return apiClient.post(`/versions/${versionId}/export/preview`, options);
  }
}

export const exportService = new ExportService();