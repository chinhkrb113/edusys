import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface CurriculumVersion {
  id: number;
  framework_id: number;
  version_no: string;
  state: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  is_frozen: boolean;
  changelog?: string;
  review_deadline?: string;
  published_at?: string;
  archived_reason?: string;
  metadata?: Record<string, unknown>;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface VersionCreateRequest {
  framework_id: number;
  changes: string;
}

export interface VersionUpdateRequest {
  changes?: string;
}

export interface VersionApprovalRequest {
  decision: 'approve' | 'reject';
  comments?: string;
}

export interface VersionPublishRequest {
  rollout_notes?: string;
}

class VersionService {
  // Create new version
  async createVersion(data: VersionCreateRequest): Promise<CurriculumVersion> {
    return apiClient.post<CurriculumVersion>('/kct/versions', data);
  }

  // Get version details with expand options
  async getVersion(id: number, expand?: string[]): Promise<CurriculumVersion> {
    const params: Record<string, string> = {};
    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }
    return apiClient.get<CurriculumVersion>(`/versions/${id}`, params);
  }

  // Update version
  async updateVersion(id: number, data: VersionUpdateRequest): Promise<void> {
    return apiClient.patch(`/versions/${id}`, data);
  }

  // Submit version for review
  async submitForReview(id: number): Promise<void> {
    return apiClient.post(`/versions/${id}/submit`);
  }

  // Approve version
  async approveVersion(id: number, data: VersionApprovalRequest): Promise<void> {
    return apiClient.post(`/versions/${id}/approve`, data);
  }

  // Publish version
  async publishVersion(id: number, data?: VersionPublishRequest): Promise<void> {
    return apiClient.post(`/versions/${id}/publish`, data);
  }

  // Archive version
  async archiveVersion(id: number): Promise<void> {
    return apiClient.delete(`/versions/${id}`);
  }

  // Get versions by framework
  async getVersionsByFramework(
    frameworkId: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<CurriculumVersion>> {
    return apiClient.get<PaginatedResponse<CurriculumVersion>>(
      `/kct/${frameworkId}/versions`,
      {
        page: page.toString(),
        page_size: pageSize.toString(),
      }
    );
  }

  // Get version history
  async getVersionHistory(
    frameworkId: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<CurriculumVersion>> {
    return apiClient.get<PaginatedResponse<CurriculumVersion>>(
      `/kct/${frameworkId}/versions/history`,
      {
        page: page.toString(),
        page_size: pageSize.toString(),
      }
    );
  }

  // Compare versions
  async compareVersions(baseVersionId: number, compareVersionId: number): Promise<{
    additions: any[];
    deletions: any[];
    modifications: any[];
  }> {
    return apiClient.get(`/versions/compare`, {
      base: baseVersionId.toString(),
      compare: compareVersionId.toString(),
    });
  }

  // Get version statistics
  async getVersionStats(frameworkId: number): Promise<{
    total_versions: number;
    published_versions: number;
    draft_versions: number;
    avg_approval_time: number;
    last_published_at?: string;
  }> {
    return apiClient.get(`/kct/${frameworkId}/versions/stats`);
  }
}

export const versionService = new VersionService();