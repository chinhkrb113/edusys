import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface Approval {
  id: number;
  tenant_id: number;
  version_id: number;
  requested_by: number;
  assigned_reviewer_id?: number;
  status: 'requested' | 'in_review' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  review_deadline?: string;
  decision?: string;
  decision_made_by?: number;
  decision_made_at?: string;
  escalation_reason?: string;
  escalated_to?: number;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalCreateRequest {
  version_id: number;
  assigned_reviewer_id?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  review_deadline?: string;
}

export interface ApprovalDecisionRequest {
  decision: 'approve' | 'reject';
  comments?: string;
}

export interface ApprovalEscalationRequest {
  escalation_reason: string;
  escalated_to: number;
}

class ApprovalsService {
  // Create approval request
  async createApproval(data: ApprovalCreateRequest): Promise<Approval> {
    return apiClient.post<Approval>('/approvals', data);
  }

  // Get approval details
  async getApproval(id: number): Promise<Approval> {
    return apiClient.get<Approval>(`/approvals/${id}`);
  }

  // Get approvals list
  async getApprovals(params?: {
    status?: 'requested' | 'in_review' | 'approved' | 'rejected' | 'escalated';
    reviewer_id?: number;
    requester_id?: number;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Approval>> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.reviewer_id) queryParams.reviewer_id = params.reviewer_id.toString();
    if (params?.requester_id) queryParams.requester_id = params.requester_id.toString();
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<Approval>>('/approvals', queryParams);
  }

  // Update approval (assign reviewer, change priority, etc.)
  async updateApproval(id: number, data: Partial<ApprovalCreateRequest>): Promise<void> {
    return apiClient.patch(`/approvals/${id}`, data);
  }

  // Make approval decision
  async makeDecision(id: number, data: ApprovalDecisionRequest): Promise<void> {
    return apiClient.post(`/approvals/${id}/decide`, data);
  }

  // Escalate approval
  async escalateApproval(id: number, data: ApprovalEscalationRequest): Promise<void> {
    return apiClient.post(`/approvals/${id}/escalate`, data);
  }

  // Get approval statistics
  async getApprovalStats(params?: {
    date_from?: string;
    date_to?: string;
    reviewer_id?: number;
  }): Promise<{
    total_approvals: number;
    pending_approvals: number;
    approved_approvals: number;
    rejected_approvals: number;
    escalated_approvals: number;
    avg_approval_time_hours: number;
    by_priority: Record<string, number>;
    by_reviewer: Array<{
      reviewer_id: number;
      reviewer_name: string;
      total_assigned: number;
      completed: number;
      avg_time_hours: number;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.reviewer_id) queryParams.reviewer_id = params.reviewer_id.toString();

    return apiClient.get('/approvals/stats', queryParams);
  }

  // Get pending approvals for current user
  async getMyPendingApprovals(): Promise<Approval[]> {
    const response = await apiClient.get<{ approvals: Approval[] }>('/approvals/my-pending');
    return response.approvals || [];
  }

  // Get approvals I requested
  async getMyRequestedApprovals(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Approval>> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<Approval>>('/approvals/my-requests', queryParams);
  }

  // Bulk assign reviewers
  async bulkAssignReviewers(data: {
    approval_ids: number[];
    reviewer_id: number;
  }): Promise<{
    assigned: number[];
    failed: Array<{
      approval_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/approvals/bulk-assign', data);
  }

  // Get approval workflow configuration
  async getWorkflowConfig(): Promise<{
    default_priorities: string[];
    escalation_levels: Array<{
      level: number;
      role: string;
      max_days: number;
    }>;
    auto_escalation_enabled: boolean;
    reminder_intervals_days: number[];
  }> {
    return apiClient.get('/approvals/workflow-config');
  }

  // Send approval reminder
  async sendReminder(id: number, message?: string): Promise<void> {
    return apiClient.post(`/approvals/${id}/remind`, { message });
  }

  // Get approval audit trail
  async getAuditTrail(id: number): Promise<Array<{
    id: number;
    action: string;
    user_id: number;
    user_name: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>> {
    return apiClient.get(`/approvals/${id}/audit-trail`);
  }
}

export const approvalsService = new ApprovalsService();