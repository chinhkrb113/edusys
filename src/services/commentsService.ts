import { apiClient } from '../lib/api';

// Types
export interface Comment {
  id: number;
  entity_type: 'curriculum_framework' | 'curriculum_version' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
  entity_id: number;
  user_id: number;
  comment: string;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends Comment {
  user_name: string;
  avatar_url?: string;
}

export interface ThreadedComment extends CommentWithUser {
  replies?: CommentWithUser[];
}

export interface CommentCreateRequest {
  entity_type: 'curriculum_framework' | 'curriculum_version' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
  entity_id: number;
  comment: string;
  parent_comment_id?: number;
}

export interface CommentUpdateRequest {
  comment: string;
}

class CommentsService {
  // Add comment
  async addComment(data: CommentCreateRequest): Promise<Comment> {
    return apiClient.post<Comment>('/comments', data);
  }

  // Get comments for entity
  async getComments(params: {
    entity_type: 'curriculum_framework' | 'curriculum_version' | 'course_blueprint' | 'unit_blueprint' | 'unit_resource';
    entity_id: number;
    include_replies?: boolean;
  }): Promise<{
    entity_type: string;
    entity_id: number;
    comments: ThreadedComment[];
    total: number;
  }> {
    const queryParams: Record<string, string> = {
      entity_type: params.entity_type,
      entity_id: params.entity_id.toString(),
    };

    if (params.include_replies !== undefined) {
      queryParams.include_replies = params.include_replies.toString();
    }

    return apiClient.get('/comments', queryParams);
  }

  // Update comment
  async updateComment(id: number, data: CommentUpdateRequest): Promise<void> {
    return apiClient.patch(`/comments/${id}`, data);
  }

  // Delete comment
  async deleteComment(id: number): Promise<void> {
    return apiClient.delete(`/comments/${id}`);
  }

  // Get comment thread
  async getCommentThread(commentId: number): Promise<{
    root_comment: ThreadedComment;
    replies: CommentWithUser[];
    total_replies: number;
  }> {
    return apiClient.get(`/comments/${commentId}/thread`);
  }

  // Like/Unlike comment
  async toggleLike(commentId: number): Promise<{
    liked: boolean;
    likes_count: number;
  }> {
    return apiClient.post(`/comments/${commentId}/like`);
  }

  // Get comment mentions
  async getMentions(query: string): Promise<Array<{
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  }>> {
    return apiClient.get('/comments/mentions', { q: query });
  }

  // Bulk delete comments
  async bulkDelete(commentIds: number[]): Promise<{
    deleted_count: number;
    failed: Array<{
      comment_id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/comments/bulk-delete', { comment_ids: commentIds });
  }

  // Get comment statistics
  async getCommentStats(params?: {
    entity_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_comments: number;
    by_entity_type: Record<string, number>;
    by_user: Array<{
      user_id: number;
      user_name: string;
      comment_count: number;
    }>;
    recent_activity: Array<{
      comment_id: number;
      entity_type: string;
      entity_id: number;
      user_name: string;
      created_at: string;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.entity_type) queryParams.entity_type = params.entity_type;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;

    return apiClient.get('/comments/stats', queryParams);
  }

  // Search comments
  async searchComments(query: {
    q?: string;
    entity_type?: string;
    entity_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    data: CommentWithUser[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (query.q) queryParams.q = query.q;
    if (query.entity_type) queryParams.entity_type = query.entity_type;
    if (query.entity_id) queryParams.entity_id = query.entity_id.toString();
    if (query.user_id) queryParams.user_id = query.user_id.toString();
    if (query.date_from) queryParams.date_from = query.date_from;
    if (query.date_to) queryParams.date_to = query.date_to;
    if (query.page) queryParams.page = query.page.toString();
    if (query.page_size) queryParams.page_size = query.page_size.toString();

    return apiClient.get('/comments/search', queryParams);
  }

  // Get comment notifications
  async getNotifications(params?: {
    unread_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{
    data: Array<{
      id: number;
      comment_id: number;
      entity_type: string;
      entity_id: number;
      message: string;
      is_read: boolean;
      created_at: string;
    }>;
    unread_count: number;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.unread_only !== undefined) queryParams.unread_only = params.unread_only.toString();
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get('/comments/notifications', queryParams);
  }

  // Mark notifications as read
  async markNotificationsRead(notificationIds: number[]): Promise<void> {
    return apiClient.post('/comments/notifications/mark-read', { notification_ids: notificationIds });
  }
}

export const commentsService = new CommentsService();