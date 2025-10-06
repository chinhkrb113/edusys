import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface KCTMapping {
  id: number;
  framework_id: number;
  version_id: number;
  target_type: 'course_template' | 'class_instance';
  target_id: number;
  campus_id?: number;
  rollout_batch?: string;
  rollout_phase: 'planned' | 'pilot' | 'phased' | 'full';
  mismatch_report?: unknown;
  risk_assessment: 'low' | 'medium' | 'high' | 'critical';
  override_reason?: string;
  status: 'planned' | 'validated' | 'applied' | 'failed' | 'rolled_back';
  applied_at?: string;
  rolled_back_at?: string;
  rollback_reason?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface MappingCreateRequest {
  framework_id: number;
  version_id: number;
  target_type: 'class_instance' | 'program_instance';
  target_id: number;
  campus_id?: number;
  rollout_batch?: string;
  override_reason?: string;
}

export interface MappingApplyRequest {
  override_reason?: string;
  force_apply?: boolean;
}

export interface MappingValidationResult {
  mapping_id: number;
  validation_result: {
    hours_diff: number;
    level_mismatch: string;
    skill_gaps: string[];
    critical_issues: boolean;
    warnings: string[];
  };
  can_proceed: boolean;
  recommendations: string[];
}

class MappingService {
  // Create KCT mapping
  async createMapping(data: MappingCreateRequest): Promise<KCTMapping> {
    return apiClient.post<KCTMapping>('/mappings', data);
  }

  // Apply mapping
  async applyMapping(id: number, data?: MappingApplyRequest): Promise<{
    message: string;
    mapping_id: number;
    applied_at: string;
  }> {
    return apiClient.post(`/mappings/${id}/apply`, data);
  }

  // Validate mapping
  async validateMapping(id: number): Promise<MappingValidationResult> {
    return apiClient.get<MappingValidationResult>(`/mappings/${id}/validate`);
  }

  // Get mappings list
  async getMappings(params?: {
    framework_id?: number;
    target_type?: 'class_instance' | 'program_instance';
    target_id?: number;
    status?: 'planned' | 'applied' | 'archived';
    campus_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<KCTMapping>> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.target_type) queryParams.target_type = params.target_type;
    if (params?.target_id) queryParams.target_id = params.target_id.toString();
    if (params?.status) queryParams.status = params.status;
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<KCTMapping>>('/mappings', queryParams);
  }

  // Archive mapping
  async archiveMapping(id: number): Promise<void> {
    return apiClient.delete(`/mappings/${id}`);
  }

  // Get mapping conflicts
  async getMappingConflicts(id: number): Promise<{
    mapping_id: number;
    conflicts: Array<{
      type: 'hours' | 'level' | 'skills' | 'resources';
      severity: 'low' | 'medium' | 'high';
      description: string;
      resolution_options: string[];
    }>;
    risk_score: number;
  }> {
    return apiClient.get(`/mappings/${id}/conflicts`);
  }

  // Resolve mapping conflicts
  async resolveConflicts(id: number, resolutions: Array<{
    conflict_id: string;
    resolution: string;
    notes?: string;
  }>): Promise<void> {
    return apiClient.post(`/mappings/${id}/resolve-conflicts`, { resolutions });
  }

  // Get mapping rollout plan
  async getRolloutPlan(id: number): Promise<{
    mapping_id: number;
    rollout_plan: {
      phases: Array<{
        phase: number;
        name: string;
        duration_days: number;
        activities: string[];
        milestones: string[];
      }>;
      total_duration: number;
      risk_mitigation: string[];
      success_metrics: string[];
    };
  }> {
    return apiClient.get(`/mappings/${id}/rollout-plan`);
  }

  // Update rollout progress
  async updateRolloutProgress(id: number, progress: {
    phase: number;
    completed_activities: string[];
    notes?: string;
  }): Promise<void> {
    return apiClient.patch(`/mappings/${id}/rollout-progress`, progress);
  }

  // Get mapping impact analysis
  async getImpactAnalysis(id: number): Promise<{
    mapping_id: number;
    impact_analysis: {
      affected_students: number;
      affected_teachers: number;
      curriculum_changes: string[];
      resource_requirements: Array<{
        type: string;
        current_count: number;
        required_count: number;
        gap: number;
      }>;
      training_needs: string[];
      timeline_impacts: Array<{
        activity: string;
        original_date: string;
        new_date: string;
        impact: string;
      }>;
    };
  }> {
    return apiClient.get(`/mappings/${id}/impact-analysis`);
  }

  // Bulk create mappings
  async bulkCreateMappings(mappings: MappingCreateRequest[]): Promise<{
    successful: KCTMapping[];
    failed: Array<{
      data: MappingCreateRequest;
      error: string;
    }>;
  }> {
    return apiClient.post('/mappings/bulk', { mappings });
  }

  // Get mapping templates
  async getMappingTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    target_type: 'class_instance' | 'program_instance';
    default_config: Partial<MappingCreateRequest>;
  }>> {
    return apiClient.get('/mappings/templates');
  }

  // Create mapping from template
  async createFromTemplate(templateId: string, customizations: Partial<MappingCreateRequest>): Promise<KCTMapping> {
    return apiClient.post('/mappings/from-template', {
      template_id: templateId,
      customizations,
    });
  }

  // Get mapping statistics
  async getMappingStats(params?: {
    framework_id?: number;
    campus_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_mappings: number;
    applied_mappings: number;
    planned_mappings: number;
    archived_mappings: number;
    by_risk_level: {
      low: number;
      medium: number;
      high: number;
    };
    by_target_type: {
      class_instance: number;
      program_instance: number;
    };
    avg_rollout_time: number;
    success_rate: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/mappings/stats', queryParams);
  }

  // Get mapping audit trail
  async getAuditTrail(id: number): Promise<Array<{
    id: number;
    action: string;
    user_id: number;
    user_name: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>> {
    return apiClient.get(`/mappings/${id}/audit-trail`);
  }

  // Rollback mapping
  async rollbackMapping(id: number, reason: string): Promise<{
    message: string;
    rollback_id: number;
    rolled_back_at: string;
  }> {
    return apiClient.post(`/mappings/${id}/rollback`, { reason });
  }
}

export const mappingService = new MappingService();