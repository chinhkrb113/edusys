import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface SavedView {
  id: number;
  tenant_id: number;
  user_id: number;
  name: string;
  entity_type: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
  filters: Record<string, unknown>;
  description?: string;
  is_public: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedViewWithCreator extends SavedView {
  creator_name?: string;
}

export interface SavedViewCreateRequest {
  name: string;
  entity_type: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
  filters: Record<string, unknown>;
  description?: string;
  is_public?: boolean;
}

export interface SavedViewUpdateRequest {
  name?: string;
  filters?: Record<string, unknown>;
  description?: string;
  is_public?: boolean;
}

class SavedViewsService {
  // List user's saved views
  async getSavedViews(params?: {
    entity_type?: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SavedView>> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<SavedView>>('/saved-views', queryParams);
  }

  // Create saved view
  async createSavedView(data: SavedViewCreateRequest): Promise<SavedView> {
    return apiClient.post<SavedView>('/saved-views', data);
  }

  // Update saved view
  async updateSavedView(id: number, data: SavedViewUpdateRequest): Promise<void> {
    return apiClient.patch(`/saved-views/${id}`, data);
  }

  // Delete saved view
  async deleteSavedView(id: number): Promise<void> {
    return apiClient.delete(`/saved-views/${id}`);
  }

  // Record view usage
  async recordUsage(id: number): Promise<void> {
    return apiClient.post(`/saved-views/${id}/use`);
  }

  // Get public saved views
  async getPublicViews(params?: {
    entity_type?: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SavedViewWithCreator>> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<SavedViewWithCreator>>('/saved-views/public', queryParams);
  }

  // Share saved view
  async shareView(id: number, userIds: number[]): Promise<{
    shared_with: number[];
    failed: Array<{
      user_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post(`/saved-views/${id}/share`, { user_ids: userIds });
  }

  // Get shared views
  async getSharedViews(params?: {
    entity_type?: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SavedViewWithCreator>> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<SavedViewWithCreator>>('/saved-views/shared', queryParams);
  }

  // Duplicate saved view
  async duplicateView(id: number, newName: string): Promise<SavedView> {
    return apiClient.post(`/saved-views/${id}/duplicate`, { name: newName });
  }

  // Get view templates
  async getViewTemplates(): Promise<Array<{
    id: string;
    name: string;
    entity_type: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
    description: string;
    default_filters: Record<string, unknown>;
    category: string;
  }>> {
    return apiClient.get('/saved-views/templates');
  }

  // Create view from template
  async createFromTemplate(templateId: string, customizations: {
    name: string;
    filters?: Record<string, unknown>;
    description?: string;
  }): Promise<SavedView> {
    return apiClient.post('/saved-views/from-template', {
      template_id: templateId,
      ...customizations,
    });
  }

  // Get view usage statistics
  async getUsageStats(params?: {
    entity_type?: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports';
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_views: number;
    total_usage: number;
    by_entity_type: Record<string, number>;
    most_used: Array<{
      view_id: number;
      name: string;
      usage_count: number;
    }>;
    recent_usage: Array<{
      view_id: number;
      name: string;
      used_at: string;
      user_name: string;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/saved-views/stats', queryParams);
  }

  // Bulk delete views
  async bulkDelete(viewIds: number[]): Promise<{
    deleted: number[];
    failed: Array<{
      view_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/saved-views/bulk-delete', { view_ids: viewIds });
  }

  // Export views
  async exportViews(viewIds: number[], format: 'json' | 'csv'): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post('/saved-views/export', {
      view_ids: viewIds,
      format,
    });
  }

  // Import views
  async importViews(file: File): Promise<{
    imported: SavedView[];
    failed: Array<{
      row: number;
      error: string;
    }>;
  }> {
    return apiClient.uploadFile('/saved-views/import', file);
  }

  // Get view recommendations
  async getRecommendations(entityType: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports'): Promise<Array<{
    view: SavedView;
    relevance_score: number;
    reason: string;
  }>> {
    return apiClient.get('/saved-views/recommendations', { entity_type: entityType });
  }

  // Set default view for entity type
  async setDefaultView(entityType: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports', viewId: number): Promise<void> {
    return apiClient.post('/saved-views/set-default', {
      entity_type: entityType,
      view_id: viewId,
    });
  }

  // Get default view for entity type
  async getDefaultView(entityType: 'curriculum_overview' | 'course_management' | 'unit_management' | 'resource_library' | 'reports'): Promise<SavedView | null> {
    const response = await apiClient.get<{ view: SavedView | null }>('/saved-views/default', {
      entity_type: entityType,
    });
    return response.view;
  }
}

export const savedViewsService = new SavedViewsService();