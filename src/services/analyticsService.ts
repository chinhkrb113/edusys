import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface UsageTracking {
  id: number;
  tenant_id: number;
  framework_id: number;
  version_id: number;
  target_type: 'course' | 'class';
  target_id: number;
  campus_id?: number;
  user_id?: number;
  action: 'view' | 'edit' | 'export' | 'apply' | 'teach';
  duration_seconds?: number;
  completion_percentage?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LearningOutcomeTracking {
  id: number;
  tenant_id: number;
  framework_id: number;
  class_id: number;
  student_id: string;
  unit_id?: number;
  assessment_type: string;
  score?: number;
  max_score: number;
  grade?: string;
  skills_assessed?: unknown[];
  feedback?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface UsageTrackingCreateRequest {
  framework_id: number;
  version_id: number;
  target_type: 'course' | 'class';
  target_id: number;
  campus_id?: number;
  action: 'view' | 'edit' | 'export' | 'apply' | 'teach';
  duration_seconds?: number;
  completion_percentage?: number;
  metadata?: Record<string, unknown>;
}

export interface LearningOutcomeCreateRequest {
  framework_id: number;
  class_id: number;
  student_id: string;
  unit_id?: number;
  assessment_type: string;
  score?: number;
  max_score?: number;
  grade?: string;
  skills_assessed?: unknown[];
  feedback?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

class AnalyticsService {
  // Track usage
  async trackUsage(data: UsageTrackingCreateRequest): Promise<void> {
    return apiClient.post('/analytics/usage', data);
  }

  // Get usage statistics
  async getUsageStats(params?: {
    framework_id?: number;
    version_id?: number;
    campus_id?: number;
    user_id?: number;
    action?: 'view' | 'edit' | 'export' | 'apply' | 'teach';
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_events: number;
    unique_users: number;
    total_duration_seconds: number;
    avg_duration_seconds: number;
    by_action: Record<string, number>;
    by_target_type: Record<string, number>;
    top_frameworks: Array<{
      framework_id: number;
      framework_name: string;
      usage_count: number;
    }>;
    daily_trends: Array<{
      date: string;
      events: number;
      unique_users: number;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.version_id) queryParams.version_id = params.version_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.user_id) queryParams.user_id = params.user_id.toString();
    if (params?.action) queryParams.action = params.action;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/analytics/usage/stats', queryParams);
  }

  // Get usage by user
  async getUsageByUser(params?: {
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<UsageTracking>> {
    const queryParams: Record<string, string> = {};
    if (params?.user_id) queryParams.user_id = params.user_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<UsageTracking>>('/analytics/usage/by-user', queryParams);
  }

  // Record learning outcome
  async recordLearningOutcome(data: LearningOutcomeCreateRequest): Promise<void> {
    return apiClient.post('/analytics/learning-outcomes', data);
  }

  // Get learning outcomes
  async getLearningOutcomes(params?: {
    framework_id?: number;
    class_id?: number;
    student_id?: string;
    unit_id?: number;
    assessment_type?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<LearningOutcomeTracking>> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.class_id) queryParams.class_id = params.class_id.toString();
    if (params?.student_id) queryParams.student_id = params.student_id;
    if (params?.unit_id) queryParams.unit_id = params.unit_id.toString();
    if (params?.assessment_type) queryParams.assessment_type = params.assessment_type;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<LearningOutcomeTracking>>('/analytics/learning-outcomes', queryParams);
  }

  // Get learning analytics
  async getLearningAnalytics(params?: {
    framework_id?: number;
    class_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_assessments: number;
    avg_score_percentage: number;
    pass_rate: number;
    grade_distribution: Record<string, number>;
    skills_mastery: Array<{
      skill: string;
      avg_score: number;
      students_mastered: number;
      total_students: number;
    }>;
    assessment_type_breakdown: Array<{
      type: string;
      count: number;
      avg_score: number;
    }>;
    student_performance_trends: Array<{
      date: string;
      avg_score: number;
      assessments_count: number;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.class_id) queryParams.class_id = params.class_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/analytics/learning-outcomes/stats', queryParams);
  }

  // Get student progress
  async getStudentProgress(params: {
    student_id: string;
    framework_id?: number;
    class_id?: number;
  }): Promise<{
    student_id: string;
    overall_progress: {
      completed_units: number;
      total_units: number;
      avg_score_percentage: number;
      current_level: string;
    };
    unit_progress: Array<{
      unit_id: number;
      unit_title: string;
      completed: boolean;
      score_percentage?: number;
      completed_at?: string;
      assessments: Array<{
        type: string;
        score?: number;
        max_score: number;
        completed_at: string;
      }>;
    }>;
    skills_progress: Array<{
      skill: string;
      current_level: 'beginner' | 'intermediate' | 'advanced';
      assessments_count: number;
      avg_score: number;
    }>;
    recommendations: string[];
  }> {
    const queryParams: Record<string, string> = {
      student_id: params.student_id,
    };
    if (params.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params.class_id) queryParams.class_id = params.class_id.toString();

    return apiClient.get('/analytics/student-progress', queryParams);
  }

  // Get curriculum effectiveness
  async getCurriculumEffectiveness(params?: {
    framework_id?: number;
    version_id?: number;
    campus_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    framework_id: number;
    version_id: number;
    effectiveness_metrics: {
      student_satisfaction_score: number;
      completion_rate: number;
      avg_learning_gain: number;
      assessment_reliability: number;
      content_quality_score: number;
    };
    comparative_analysis: {
      vs_previous_version?: {
        improvement_percentage: number;
        key_changes: string[];
      };
      vs_other_frameworks?: Array<{
        framework_id: number;
        framework_name: string;
        comparison_score: number;
      }>;
    };
    recommendations: string[];
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.version_id) queryParams.version_id = params.version_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/analytics/curriculum-effectiveness', queryParams);
  }

  // Export analytics data
  async exportAnalytics(params: {
    data_type: 'usage' | 'learning_outcomes' | 'effectiveness';
    format: 'csv' | 'xlsx' | 'json';
    date_from?: string;
    date_to?: string;
    filters?: Record<string, unknown>;
  }): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    return apiClient.post('/analytics/export', params);
  }

  // Get real-time analytics
  async getRealtimeAnalytics(params?: {
    framework_id?: number;
    campus_id?: number;
  }): Promise<{
    active_users_last_hour: number;
    assessments_completed_today: number;
    curriculums_viewed_today: number;
    top_active_frameworks: Array<{
      framework_id: number;
      name: string;
      active_users: number;
    }>;
    recent_activity: Array<{
      type: string;
      description: string;
      timestamp: string;
      user_name?: string;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.framework_id) queryParams.framework_id = params.framework_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();

    return apiClient.get('/analytics/realtime', queryParams);
  }

  // Generate predictive analytics
  async getPredictiveAnalytics(params: {
    framework_id: number;
    prediction_type: 'completion_rate' | 'student_performance' | 'resource_usage';
    time_horizon_days: number;
  }): Promise<{
    framework_id: number;
    prediction_type: string;
    time_horizon_days: number;
    predictions: Array<{
      date: string;
      predicted_value: number;
      confidence_interval: {
        lower: number;
        upper: number;
      };
      factors: Record<string, number>;
    }>;
    accuracy_metrics: {
      historical_accuracy: number;
      confidence_level: number;
    };
    recommendations: string[];
  }> {
    return apiClient.post('/analytics/predictive', params);
  }
}

export const analyticsService = new AnalyticsService();