import { apiClient } from '../lib/api';

// Types
export interface TenantSettings {
  tenant_id: number;
  hours_tolerance: number;
  draft_export_watermark: boolean;
  required_skills_by_level?: Record<string, string[]>;
  cefr_minima?: Record<string, { min_units: number; min_skills: number }>;
  max_draft_age_days: number;
  require_qr_for_published_exports: boolean;
  allow_override_with_justification: boolean;
  default_campus_branding?: Record<string, unknown>;
  ai_generation_enabled: boolean;
  auto_health_checks_enabled: boolean;
  webhook_endpoints?: string[];
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdateRequest {
  hours_tolerance?: number;
  draft_export_watermark?: boolean;
  required_skills_by_level?: Record<string, string[]>;
  cefr_minima?: Record<string, { min_units: number; min_skills: number }>;
  max_draft_age_days?: number;
  require_qr_for_published_exports?: boolean;
  allow_override_with_justification?: boolean;
  default_campus_branding?: Record<string, unknown>;
  ai_generation_enabled?: boolean;
  auto_health_checks_enabled?: boolean;
  webhook_endpoints?: string[];
}

export interface CampusSettings {
  campus_id: number;
  tenant_id: number;
  branding?: Record<string, unknown>;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  features_enabled?: Record<string, boolean>;
  custom_settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampusSettingsUpdateRequest {
  branding?: Record<string, unknown>;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  features_enabled?: Record<string, boolean>;
  custom_settings?: Record<string, unknown>;
}

class SettingsService {
  // Get tenant settings
  async getTenantSettings(): Promise<TenantSettings> {
    return apiClient.get<TenantSettings>('/settings/tenant');
  }

  // Update tenant settings
  async updateTenantSettings(data: SettingsUpdateRequest): Promise<void> {
    return apiClient.patch('/settings/tenant', data);
  }

  // Get campus settings
  async getCampusSettings(campusId: number): Promise<CampusSettings> {
    return apiClient.get<CampusSettings>(`/settings/campus/${campusId}`);
  }

  // Update campus settings
  async updateCampusSettings(campusId: number, data: CampusSettingsUpdateRequest): Promise<void> {
    return apiClient.patch(`/settings/campus/${campusId}`, data);
  }

  // Get all campus settings for tenant
  async getAllCampusSettings(): Promise<CampusSettings[]> {
    const response = await apiClient.get<{ campuses: CampusSettings[] }>('/settings/campus');
    return response.campuses || [];
  }

  // Reset tenant settings to defaults
  async resetTenantSettings(): Promise<void> {
    return apiClient.post('/settings/tenant/reset');
  }

  // Reset campus settings to defaults
  async resetCampusSettings(campusId: number): Promise<void> {
    return apiClient.post(`/settings/campus/${campusId}/reset`);
  }

  // Get settings validation rules
  async getValidationRules(): Promise<{
    hours_tolerance: { min: number; max: number };
    max_draft_age_days: { min: number; max: number };
    required_skills_levels: string[];
    cefr_levels: string[];
  }> {
    return apiClient.get('/settings/validation-rules');
  }

  // Test webhook endpoint
  async testWebhook(url: string, payload?: Record<string, unknown>): Promise<{
    success: boolean;
    response_time_ms?: number;
    status_code?: number;
    error?: string;
  }> {
    return apiClient.post('/settings/test-webhook', {
      url,
      payload: payload || { test: true, timestamp: new Date().toISOString() }
    });
  }

  // Get settings audit log
  async getAuditLog(params?: {
    entity_type?: 'tenant' | 'campus';
    entity_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    data: Array<{
      id: number;
      entity_type: string;
      entity_id: number;
      user_id: number;
      user_name: string;
      action: string;
      old_values?: Record<string, unknown>;
      new_values?: Record<string, unknown>;
      timestamp: string;
    }>;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.entity_id) queryParams.entity_id = params.entity_id.toString();
    if (params?.user_id) queryParams.user_id = params.user_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get('/settings/audit', queryParams);
  }

  // Export settings
  async exportSettings(): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post('/settings/export');
  }

  // Import settings
  async importSettings(file: File): Promise<{
    imported: {
      tenant_settings: boolean;
      campus_settings: number;
    };
    failed: Array<{
      entity: string;
      error: string;
    }>;
  }> {
    return apiClient.uploadFile('/settings/import', file);
  }

  // Get settings templates
  async getSettingsTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    template_data: Record<string, unknown>;
  }>> {
    return apiClient.get('/settings/templates');
  }

  // Apply settings template
  async applyTemplate(templateId: string, targetCampusIds?: number[]): Promise<{
    applied_to_tenant: boolean;
    applied_to_campuses: number[];
    failed: Array<{
      campus_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/settings/apply-template', {
      template_id: templateId,
      target_campus_ids: targetCampusIds,
    });
  }

  // Get feature flags
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    return apiClient.get('/settings/features');
  }

  // Update feature flags
  async updateFeatureFlags(flags: Record<string, boolean>): Promise<void> {
    return apiClient.patch('/settings/features', { flags });
  }

  // Get system health settings
  async getHealthSettings(): Promise<{
    auto_health_checks_enabled: boolean;
    health_check_interval_hours: number;
    alert_thresholds: {
      broken_links_percentage: number;
      expired_resources_days: number;
    };
    notification_channels: string[];
  }> {
    return apiClient.get('/settings/health');
  }

  // Update health settings
  async updateHealthSettings(data: {
    auto_health_checks_enabled?: boolean;
    health_check_interval_hours?: number;
    alert_thresholds?: {
      broken_links_percentage?: number;
      expired_resources_days?: number;
    };
    notification_channels?: string[];
  }): Promise<void> {
    return apiClient.patch('/settings/health', data);
  }
}

export const settingsService = new SettingsService();