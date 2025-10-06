import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface Tag {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  entity_type?: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
  color: string;
  usage_count: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface TagWithUsage extends Tag {
  framework_usage: number;
  course_usage: number;
  unit_usage: number;
  resource_usage: number;
}

export interface TagCreateRequest {
  name: string;
  description?: string;
  entity_type?: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
  color?: string;
}

export interface TagUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
}

class TagsService {
  // List tags
  async getTags(params?: {
    q?: string;
    entity_type?: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<TagWithUsage>> {
    const queryParams: Record<string, string> = {};
    if (params?.q) queryParams.q = params.q;
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<TagWithUsage>>('/tags', queryParams);
  }

  // Create tag
  async createTag(data: TagCreateRequest): Promise<Tag> {
    return apiClient.post<Tag>('/tags', data);
  }

  // Update tag
  async updateTag(id: number, data: TagUpdateRequest): Promise<void> {
    return apiClient.patch(`/tags/${id}`, data);
  }

  // Delete tag
  async deleteTag(id: number): Promise<void> {
    return apiClient.delete(`/tags/${id}`);
  }

  // Attach tag to entity
  async attachTag(tagId: number, data: {
    entity_type: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
  }): Promise<void> {
    return apiClient.post(`/tags/${tagId}/attach`, data);
  }

  // Detach tag from entity
  async detachTag(tagId: number, data: {
    entity_type: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
  }): Promise<void> {
    return apiClient.delete(`/tags/${tagId}/detach`, data);
  }

  // Get tags for entity
  async getEntityTags(params: {
    entity_type: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
  }): Promise<Tag[]> {
    const queryParams: Record<string, string> = {
      entity_type: params.entity_type,
      entity_id: params.entity_id.toString(),
    };

    const response = await apiClient.get<{ tags: Tag[] }>('/tags/entity', queryParams);
    return response.tags || [];
  }

  // Bulk attach tags
  async bulkAttachTags(data: {
    entity_type: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
    tag_ids: number[];
  }): Promise<{
    attached: number[];
    failed: Array<{
      tag_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/tags/bulk-attach', data);
  }

  // Bulk detach tags
  async bulkDetachTags(data: {
    entity_type: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
    tag_ids: number[];
  }): Promise<{
    detached: number[];
    failed: Array<{
      tag_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/tags/bulk-detach', data);
  }

  // Get tag suggestions
  async getTagSuggestions(params: {
    entity_type?: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    query?: string;
    limit?: number;
  }): Promise<Array<{
    id: number;
    name: string;
    description?: string;
    usage_count: number;
    color: string;
  }>> {
    const queryParams: Record<string, string> = {};
    if (params.entity_type) queryParams.entity_type = params.entity_type;
    if (params.query) queryParams.query = params.query;
    if (params.limit) queryParams.limit = params.limit.toString();

    return apiClient.get('/tags/suggestions', queryParams);
  }

  // Get tag statistics
  async getTagStats(): Promise<{
    total_tags: number;
    by_entity_type: Record<string, number>;
    most_used: Array<{
      tag_id: number;
      name: string;
      usage_count: number;
      color: string;
    }>;
    recently_created: Tag[];
    unused_tags: Tag[];
  }> {
    return apiClient.get('/tags/stats');
  }

  // Merge tags
  async mergeTags(data: {
    source_tag_id: number;
    target_tag_id: number;
  }): Promise<{
    merged_entities: number;
    message: string;
  }> {
    return apiClient.post('/tags/merge', data);
  }

  // Export tags
  async exportTags(format: 'csv' | 'json'): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post('/tags/export', { format });
  }

  // Import tags
  async importTags(file: File): Promise<{
    imported: number;
    failed: Array<{
      row: number;
      error: string;
    }>;
  }> {
    return apiClient.uploadFile('/tags/import', file);
  }

  // Get tag cloud
  async getTagCloud(params?: {
    entity_type?: 'curriculum_framework' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    min_usage?: number;
    max_tags?: number;
  }): Promise<Array<{
    id: number;
    name: string;
    weight: number; // Based on usage count
    color: string;
  }>> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.min_usage) queryParams.min_usage = params.min_usage.toString();
    if (params?.max_tags) queryParams.max_tags = params.max_tags.toString();

    return apiClient.get('/tags/cloud', queryParams);
  }
}

export const tagsService = new TagsService();