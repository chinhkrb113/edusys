import { apiClient } from '../lib/api';

// Types
export interface UnitBlueprint {
  id: number;
  course_blueprint_id: number;
  title: string;
  subtitle?: string;
  objectives?: unknown[];
  skills?: unknown[];
  activities?: unknown[];
  rubric?: unknown;
  homework?: string;
  hours: number;
  order_index: number;
  completeness_score: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: number;
  notes?: string;
  ai_generated: boolean;
  ai_confidence?: number;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface UnitCreateRequest {
  title: string;
  objectives?: string[];
  skills?: string[];
  activities?: Array<{
    type: 'Class' | 'Group' | 'Individual';
    name: string;
  }>;
  rubric?: Record<string, unknown>;
  homework?: string;
  hours?: number;
  order_index?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: number;
}

export interface UnitUpdateRequest {
  title?: string;
  objectives?: string[];
  skills?: string[];
  activities?: Array<{
    type: 'Class' | 'Group' | 'Individual';
    name: string;
  }>;
  rubric?: Record<string, unknown>;
  homework?: string;
  hours?: number;
  order_index?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: number;
}

export interface UnitReorderRequest {
  course_id: number;
  orders: Array<{
    unit_id: number;
    order_index: number;
  }>;
}

export interface UnitSplitRequest {
  split_after_order_index: number;
  new_unit_title: string;
}

class UnitService {
  // Create unit
  async createUnit(courseId: number, data: UnitCreateRequest): Promise<UnitBlueprint> {
    return apiClient.post<UnitBlueprint>(`/courses/${courseId}/units`, data);
  }

  // Update unit
  async updateUnit(id: number, data: UnitUpdateRequest): Promise<void> {
    return apiClient.patch(`/units/${id}`, data);
  }

  // Delete unit
  async deleteUnit(id: number): Promise<void> {
    return apiClient.delete(`/units/${id}`);
  }

  // Get unit details
  async getUnit(id: number): Promise<UnitBlueprint> {
    return apiClient.get<UnitBlueprint>(`/units/${id}`);
  }

  // Get units by course
  async getUnitsByCourse(courseId: number): Promise<UnitBlueprint[]> {
    const response = await apiClient.get<{ units: UnitBlueprint[] }>(`/courses/${courseId}/units`);
    return response.units || [];
  }

  // Reorder units
  async reorderUnits(data: UnitReorderRequest): Promise<void> {
    return apiClient.post('/units/reorder', data);
  }

  // Split unit
  async splitUnit(id: number, data: UnitSplitRequest): Promise<void> {
    return apiClient.post(`/units/${id}/split`, data);
  }

  // Get unit completeness
  async getUnitCompleteness(id: number): Promise<{
    score: number;
    breakdown: {
      objectives: boolean;
      skills: boolean;
      activities: boolean;
      rubric: boolean;
      resources: boolean;
    };
  }> {
    return apiClient.get(`/units/${id}/completeness`);
  }

  // Generate AI suggestions for unit
  async generateAISuggestions(id: number): Promise<{
    objectives: string[];
    activities: Array<{
      type: 'Class' | 'Group' | 'Individual';
      name: string;
    }>;
    assessment: string;
  }> {
    return apiClient.post(`/units/${id}/ai-suggestions`);
  }

  // Duplicate unit
  async duplicateUnit(id: number, targetCourseId: number): Promise<UnitBlueprint> {
    return apiClient.post(`/units/${id}/duplicate`, { target_course_id: targetCourseId });
  }

  // Get unit templates
  async getUnitTemplates(level?: string, skill?: string): Promise<Array<{
    id: string;
    title: string;
    level: string;
    skills: string[];
    estimated_time: number;
  }>> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (skill) params.skill = skill;

    return apiClient.get('/units/templates', params);
  }

  // Create unit from template
  async createFromTemplate(courseId: number, templateId: string, customizations?: Partial<UnitCreateRequest>): Promise<UnitBlueprint> {
    return apiClient.post(`/courses/${courseId}/units/from-template`, {
      template_id: templateId,
      customizations,
    });
  }

  // Bulk update units
  async bulkUpdateUnits(updates: Array<{
    id: number;
    data: UnitUpdateRequest;
  }>): Promise<void> {
    return apiClient.post('/units/bulk-update', { updates });
  }

  // Get unit learning outcomes
  async getUnitLearningOutcomes(id: number): Promise<{
    cognitive: string[];
    affective: string[];
    psychomotor: string[];
  }> {
    return apiClient.get(`/units/${id}/learning-outcomes`);
  }

  // Validate unit content
  async validateUnit(id: number): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    return apiClient.post(`/units/${id}/validate`);
  }
}

export const unitService = new UnitService();