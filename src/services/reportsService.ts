import { apiClient } from '../lib/api';

// Types
export interface CEFCoverageReport {
  coverage_matrix: Array<{
    framework_name: string;
    skill_coverage: {
      listening: number;
      speaking: number;
      reading: number;
      writing: number;
      grammar: number;
      vocabulary: number;
    };
    avg_completeness: number;
    total_units: number;
    total_courses: number;
  }>;
  generated_at: string;
}

export interface ApprovalTimeReport {
  approval_timeline: Array<{
    framework_name: string;
    version_no: string;
    submitted_at: string;
    approved_at?: string;
    approval_hours?: number;
    approval_days?: number;
    approver_name?: string;
  }>;
  summary: {
    total_approvals: number;
    avg_approval_time_hours: number;
    avg_approval_time_days: number;
    period_days: number;
  };
  generated_at: string;
}

export interface CEFRMatrixReport {
  cefr_matrix: Array<{
    framework_name: string;
    target_level: string;
    cefr_coverage: Record<string, { covered: number; total: number }>;
  }>;
  compliance_threshold: number;
  generated_at: string;
}

export interface CurriculumImpactReport {
  impact_analysis: Array<{
    framework_name: string;
    deployments: number;
    active_classes: number;
    avg_completion_rate?: number;
    avg_engagement?: number;
    total_students_impacted?: number;
    last_deployment?: string;
  }>;
  analysis_period_months: number;
  key_metrics: {
    total_deployments: number;
    total_students_impacted: number;
    avg_completion_rate: number;
    avg_engagement_score: number;
  };
  generated_at: string;
}

export interface AdoptionReport {
  adoption_trends: Array<{
    date: string;
    new_deployments: number;
    active_instances: number;
    framework_name: string;
  }>;
  period: string;
  period_days: number;
  summary: {
    total_deployments: number;
    avg_daily_deployments: number;
    peak_day?: {
      date: string;
      deployments: number;
    };
  };
  generated_at: string;
}

class ReportsService {
  // CEFR Coverage Matrix
  async getCEFCoverage(params?: {
    framework_id?: number;
    version_id?: number;
    campus_id?: number;
  }): Promise<CEFCoverageReport> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.version_id) queryParams.version_id = params.version_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();

    return apiClient.get<CEFCoverageReport>('/reports/kct/coverage', queryParams);
  }

  // Approval Timeline Analytics
  async getApprovalTime(params?: {
    days?: number;
    framework_id?: number;
  }): Promise<ApprovalTimeReport> {
    const queryParams: Record<string, string> = {};
    if (params?.days) queryParams.days = params.days.toString();
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();

    return apiClient.get<ApprovalTimeReport>('/reports/kct/approval-time', queryParams);
  }

  // CEFR Compliance Matrix
  async getCEFRMatrix(params?: {
    framework_id?: number;
    level?: string;
  }): Promise<CEFRMatrixReport> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.level) queryParams.level = params.level;

    return apiClient.get<CEFRMatrixReport>('/reports/kct/cefr-matrix', queryParams);
  }

  // Curriculum Impact Analysis
  async getCurriculumImpact(params?: {
    framework_id?: number;
    months?: number;
  }): Promise<CurriculumImpactReport> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.months) queryParams.months = params.months.toString();

    return apiClient.get<CurriculumImpactReport>('/reports/kct/impact', queryParams);
  }

  // Framework Adoption Rates
  async getAdoptionRates(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<AdoptionReport> {
    const queryParams: Record<string, string> = {};
    if (params?.period) queryParams.period = params.period;

    return apiClient.get<AdoptionReport>('/reports/kct/adoption', queryParams);
  }

  // Custom Report Builder
  async createCustomReport(config: {
    name: string;
    description?: string;
    metrics: string[];
    filters: Record<string, unknown>;
    group_by?: string[];
    date_range?: {
      from: string;
      to: string;
    };
    format: 'json' | 'csv' | 'pdf';
  }): Promise<{
    report_id: string;
    status: 'queued' | 'processing' | 'completed';
    estimated_completion: string;
  }> {
    return apiClient.post('/reports/custom', config);
  }

  // Get Custom Report Status
  async getCustomReportStatus(reportId: string): Promise<{
    report_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    result_url?: string;
    error_message?: string;
  }> {
    return apiClient.get(`/reports/custom/${reportId}/status`);
  }

  // Get Report Templates
  async getReportTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    default_config: Record<string, unknown>;
    required_permissions: string[];
  }>> {
    return apiClient.get('/reports/templates');
  }

  // Generate Report from Template
  async generateFromTemplate(templateId: string, customizations?: Record<string, unknown>): Promise<{
    report_id: string;
    status: string;
    estimated_completion: string;
  }> {
    return apiClient.post('/reports/from-template', {
      template_id: templateId,
      customizations,
    });
  }

  // Get Report Schedule
  async getReportSchedule(): Promise<Array<{
    id: string;
    name: string;
    template_id: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    last_run?: string;
    next_run: string;
    is_active: boolean;
  }>> {
    return apiClient.get('/reports/schedule');
  }

  // Schedule Report
  async scheduleReport(config: {
    name: string;
    template_id: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    customizations?: Record<string, unknown>;
  }): Promise<{
    schedule_id: string;
    next_run: string;
  }> {
    return apiClient.post('/reports/schedule', config);
  }

  // Get Dashboard Metrics
  async getDashboardMetrics(): Promise<{
    total_frameworks: number;
    active_deployments: number;
    pending_approvals: number;
    avg_approval_time: number;
    compliance_rate: number;
    recent_activity: Array<{
      type: string;
      description: string;
      timestamp: string;
      user: string;
    }>;
  }> {
    return apiClient.get('/reports/dashboard');
  }

  // Export Report Data
  async exportReportData(reportType: string, format: 'csv' | 'xlsx', params?: Record<string, unknown>): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post('/reports/export', {
      report_type: reportType,
      format,
      params,
    });
  }

  // Get Report History
  async getReportHistory(params?: {
    report_type?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    data: Array<{
      id: string;
      name: string;
      type: string;
      generated_by: number;
      generated_at: string;
      status: string;
      download_url?: string;
    }>;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.report_type) queryParams.report_type = params.report_type;
    if (params?.user_id) queryParams.user_id = params.user_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get('/reports/history', queryParams);
  }
}

export const reportsService = new ReportsService();