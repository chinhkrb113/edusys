import { apiClient } from '../lib/api';

// Types
export interface UnitResource {
  id: number;
  unit_id: number;
  kind: 'pdf' | 'slide' | 'video' | 'audio' | 'link' | 'doc' | 'image' | 'worksheet' | 'interactive';
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  ocr_text?: string;
  ai_tags?: Record<string, unknown>;
  manual_tags?: string[];
  license_type?: string;
  license_note?: string;
  accessibility_features?: unknown;
  health_status: 'healthy' | 'broken' | 'expired' | 'restricted' | 'unknown';
  last_health_check?: string;
  order_index: number;
  is_required: boolean;
  download_count: number;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreateRequest {
  title: string;
  description?: string;
  url?: string;
  manual_tags?: string[];
  license_type?: string;
  license_note?: string;
  order_index?: number;
  is_required?: boolean;
}

export interface ResourceUpdateRequest {
  title?: string;
  description?: string;
  url?: string;
  manual_tags?: string[];
  license_type?: string;
  license_note?: string;
  order_index?: number;
  is_required?: boolean;
}

export interface ResourceUploadRequest extends ResourceCreateRequest {
  file: File;
}

class ResourceService {
  // Add resource to unit
  async addResource(unitId: number, data: ResourceCreateRequest): Promise<UnitResource> {
    return apiClient.post<UnitResource>(`/units/${unitId}/resources`, data);
  }

  // Upload file resource
  async uploadResource(unitId: number, file: File, metadata: ResourceCreateRequest): Promise<UnitResource> {
    return apiClient.uploadFile<UnitResource>(`/units/${unitId}/resources`, file, {
      title: metadata.title,
      description: metadata.description || '',
      manual_tags: metadata.manual_tags ? JSON.stringify(metadata.manual_tags) : '',
      license_type: metadata.license_type || '',
      license_note: metadata.license_note || '',
      order_index: metadata.order_index?.toString() || '0',
      is_required: metadata.is_required?.toString() || 'false',
    });
  }

  // Update resource
  async updateResource(id: number, data: ResourceUpdateRequest): Promise<void> {
    return apiClient.patch(`/resources/${id}`, data);
  }

  // Delete resource
  async deleteResource(id: number): Promise<void> {
    return apiClient.delete(`/resources/${id}`);
  }

  // Get resource details
  async getResource(id: number): Promise<UnitResource> {
    return apiClient.get<UnitResource>(`/resources/${id}`);
  }

  // Get resources by unit
  async getResourcesByUnit(unitId: number): Promise<UnitResource[]> {
    const response = await apiClient.get<{ resources: UnitResource[] }>(`/units/${unitId}/resources`);
    return response.resources || [];
  }

  // Download resource file
  async downloadResource(id: number): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/resources/${id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // Trigger AI analysis
  async analyzeResource(id: number): Promise<{
    tags: Record<string, unknown>;
    ocr_text: string;
    accessibility_score: number;
    suggestions: string[];
  }> {
    return apiClient.post(`/resources/${id}/ai-analyze`);
  }

  // Get resource health status
  async checkResourceHealth(id: number): Promise<{
    status: 'healthy' | 'broken' | 'expired';
    last_checked: string;
    issues: string[];
  }> {
    return apiClient.get(`/resources/${id}/health`);
  }

  // Bulk check resource health
  async checkBulkHealth(unitId: number): Promise<Array<{
    resource_id: number;
    status: 'healthy' | 'broken' | 'expired';
    issues: string[];
  }>> {
    return apiClient.post(`/units/${unitId}/resources/health-check`);
  }

  // Search resources
  async searchResources(query: {
    q?: string;
    kind?: string;
    license_type?: string;
    is_required?: boolean;
    unit_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<{
    data: UnitResource[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const params: Record<string, string> = {};
    if (query.q) params.q = query.q;
    if (query.kind) params.kind = query.kind;
    if (query.license_type) params.license_type = query.license_type;
    if (query.is_required !== undefined) params.is_required = query.is_required.toString();
    if (query.unit_id) params.unit_id = query.unit_id.toString();
    if (query.page) params.page = query.page.toString();
    if (query.page_size) params.page_size = query.page_size.toString();

    return apiClient.get('/resources/search', params);
  }

  // Get resource statistics
  async getResourceStats(unitId?: number): Promise<{
    total_resources: number;
    by_kind: Record<string, number>;
    by_license: Record<string, number>;
    health_status: {
      healthy: number;
      broken: number;
      expired: number;
      unknown: number;
    };
    total_downloads: number;
    avg_file_size: number;
  }> {
    const params: Record<string, string> = {};
    if (unitId) params.unit_id = unitId.toString();

    return apiClient.get('/resources/stats', params);
  }

  // Duplicate resource to another unit
  async duplicateResource(id: number, targetUnitId: number): Promise<UnitResource> {
    return apiClient.post(`/resources/${id}/duplicate`, { target_unit_id: targetUnitId });
  }

  // Bulk update resources
  async bulkUpdateResources(updates: Array<{
    id: number;
    data: ResourceUpdateRequest;
  }>): Promise<void> {
    return apiClient.post('/resources/bulk-update', { updates });
  }

  // Get resource templates
  async getResourceTemplates(kind?: string): Promise<Array<{
    id: string;
    title: string;
    kind: string;
    description: string;
    tags: string[];
  }>> {
    const params: Record<string, string> = {};
    if (kind) params.kind = kind;

    return apiClient.get('/resources/templates', params);
  }

  // Create resource from template
  async createFromTemplate(unitId: number, templateId: string, customizations?: Partial<ResourceCreateRequest>): Promise<UnitResource> {
    return apiClient.post(`/units/${unitId}/resources/from-template`, {
      template_id: templateId,
      customizations,
    });
  }

  // Validate resource URLs
  async validateUrls(unitId: number): Promise<Array<{
    resource_id: number;
    url: string;
    is_valid: boolean;
    status_code?: number;
    error?: string;
  }>> {
    return apiClient.post(`/units/${unitId}/resources/validate-urls`);
  }

  // Get resource usage analytics
  async getUsageAnalytics(unitId?: number, days = 30): Promise<{
    downloads_over_time: Array<{
      date: string;
      downloads: number;
    }>;
    top_resources: Array<{
      resource_id: number;
      title: string;
      downloads: number;
    }>;
    access_patterns: {
      peak_hours: number[];
      popular_days: string[];
    };
  }> {
    const params: Record<string, string> = {
      days: days.toString(),
    };
    if (unitId) params.unit_id = unitId.toString();

    return apiClient.get('/resources/analytics', params);
  }
}

export const resourceService = new ResourceService();