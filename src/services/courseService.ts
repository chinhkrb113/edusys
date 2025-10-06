import { apiClient } from '../lib/api';

export interface CourseBlueprint {
  id: number;
  version_id: number;
  code?: string;
  title: string;
  subtitle?: string;
  level?: string;
  hours: number;
  order_index: number;
  summary?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseRequest {
  code?: string;
  title: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  order_index?: number;
  summary?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
}

export interface UpdateCourseRequest {
  code?: string;
  title?: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  order_index?: number;
  summary?: string;
  learning_outcomes?: unknown[];
  assessment_types?: unknown[];
  prerequisites?: string;
}

export interface ReorderCoursesRequest {
  version_id: number;
  orders: Array<{
    course_id: number;
    order_index: number;
  }>;
}

export const courseService = {
  async createCourse(versionId: number, courseData: CreateCourseRequest): Promise<CourseBlueprint> {
    return apiClient.post<CourseBlueprint>(`/versions/${versionId}/courses`, courseData);
  },

  async updateCourse(id: number, updates: UpdateCourseRequest): Promise<void> {
    return apiClient.patch(`/courses/${id}`, updates);
  },

  async deleteCourse(id: number): Promise<void> {
    return apiClient.delete(`/courses/${id}`);
  },

  async getCourse(id: number): Promise<CourseBlueprint> {
    return apiClient.get<CourseBlueprint>(`/courses/${id}`);
  },

  async getCoursesByVersion(versionId: number): Promise<CourseBlueprint[]> {
    const response = await apiClient.get<{ courses: CourseBlueprint[] }>(`/versions/${versionId}/courses`);
    return response.courses || [];
  },

  async reorderCourses(reorderData: ReorderCoursesRequest): Promise<void> {
    return apiClient.post('/courses/reorder', reorderData);
  },
};