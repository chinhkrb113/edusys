import { apiClient } from '../lib/api';

export interface CurriculumFramework {
  id: number;
  tenant_id: number;
  campus_id?: number;
  code: string;
  name: string;
  language: string;
  displayLanguage?: string; // Added: Full language name (e.g., "English", "Japanese")
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_hours: number;
  total_sessions: number; // Tổng số buổi học
  session_duration_hours?: number; // Thời gian học/buổi (giờ)
  learning_method?: string; // Cách thức học
  learning_format?: string; // Hình thức học
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  owner_user_id?: number;
  latest_version_id?: number;
  description?: string;
  learning_objectives?: any[];
  prerequisites?: any[];
  assessment_strategy?: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  latest_version_no?: string;
  latest_version_state?: string;
  owner_name?: string; // Added: Full name from users table
  tags?: string[];
}

export interface CreateCurriculumRequest {
  code: string;
  name: string;
  language: string;
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_sessions?: number; // Added: Tổng số buổi học
  session_duration_hours?: number; // Added: Thời gian học/buổi (giờ)
  learning_method?: string; // Added: Cách thức học
  learning_format?: string; // Added: Hình thức học
  campus_id?: number;
  description?: string;
  learning_objectives?: unknown[];
  prerequisites?: unknown[];
  assessment_strategy?: string;
}

export interface UpdateCurriculumRequest {
  name?: string;
  target_level?: string;
  age_group?: 'kids' | 'teens' | 'adults' | 'all';
  total_sessions?: number; // Added: Tổng số buổi học
  session_duration_hours?: number; // Added: Thời gian học/buổi (giờ)
  learning_method?: string; // Added: Cách thức học
  learning_format?: string; // Added: Hình thức học
  campus_id?: number;
  description?: string;
  learning_objectives?: unknown[];
  prerequisites?: unknown[];
  assessment_strategy?: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
}

export interface CurriculumListResponse {
  data: CurriculumFramework[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CurriculumFilters {
  status?: string;
  language?: string;
  age_group?: string;
  target_level?: string;
  owner_user_id?: number;
  campus_id?: number;
  tag?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export const curriculumService = {
  async getCurriculums(filters?: CurriculumFilters): Promise<CurriculumListResponse> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const endpoint = queryParams.toString() ? `/kct?${queryParams.toString()}` : '/kct';
    return apiClient.get<CurriculumListResponse>(endpoint);
  },

  async createCurriculum(curriculumData: CreateCurriculumRequest): Promise<CurriculumFramework> {
    return apiClient.post<CurriculumFramework>('/kct', curriculumData);
  },

  async getCurriculum(id: number): Promise<CurriculumFramework> {
    return apiClient.get<CurriculumFramework>(`/kct/${id}`);
  },

  async updateCurriculum(id: number, updates: UpdateCurriculumRequest): Promise<void> {
    return apiClient.patch(`/kct/${id}`, updates);
  },

  async deleteCurriculum(id: number): Promise<void> {
    return apiClient.delete(`/kct/${id}`);
  },
};
