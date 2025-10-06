import { apiClient, PaginatedResponse } from '../lib/api';

// Types
export interface Tenant {
  id: number;
  code: string;
  name: string;
  domain?: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'bgh' | 'program_owner' | 'curriculum_designer' | 'teacher' | 'qa' | 'viewer';
  campus_id?: number;
  is_active: boolean;
  last_login_at?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TenantCreateRequest {
  code: string;
  name: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

export interface CampusCreateRequest {
  code: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  settings?: Record<string, unknown>;
}

export interface UserCreateRequest {
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'bgh' | 'program_owner' | 'curriculum_designer' | 'teacher' | 'qa' | 'viewer';
  campus_id?: number;
  preferences?: Record<string, unknown>;
}

export interface TenantUpdateRequest {
  name?: string;
  domain?: string;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

export interface CampusUpdateRequest {
  name?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

export interface UserUpdateRequest {
  full_name?: string;
  role?: 'super_admin' | 'admin' | 'bgh' | 'program_owner' | 'curriculum_designer' | 'teacher' | 'qa' | 'viewer';
  campus_id?: number;
  is_active?: boolean;
  preferences?: Record<string, unknown>;
}

class TenantService {
  // Tenant CRUD
  async getTenants(params?: {
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Tenant>> {
    const queryParams: Record<string, string> = {};
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<Tenant>>('/tenants', queryParams);
  }

  async getTenant(id: number): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  }

  async createTenant(data: TenantCreateRequest): Promise<Tenant> {
    return apiClient.post<Tenant>('/tenants', data);
  }

  async updateTenant(id: number, data: TenantUpdateRequest): Promise<void> {
    return apiClient.patch(`/tenants/${id}`, data);
  }

  async deleteTenant(id: number): Promise<void> {
    return apiClient.delete(`/tenants/${id}`);
  }

  // Campus CRUD
  async getCampuses(params?: {
    tenant_id?: number;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Campus>> {
    const queryParams: Record<string, string> = {};
    if (params?.tenant_id) queryParams.tenant_id = params.tenant_id.toString();
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<Campus>>('/campuses', queryParams);
  }

  async getCampus(id: number): Promise<Campus> {
    return apiClient.get<Campus>(`/campuses/${id}`);
  }

  async createCampus(data: CampusCreateRequest): Promise<Campus> {
    return apiClient.post<Campus>('/campuses', data);
  }

  async updateCampus(id: number, data: CampusUpdateRequest): Promise<void> {
    return apiClient.patch(`/campuses/${id}`, data);
  }

  async deleteCampus(id: number): Promise<void> {
    return apiClient.delete(`/campuses/${id}`);
  }

  // User CRUD
  async getUsers(params?: {
    tenant_id?: number;
    campus_id?: number;
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<User>> {
    const queryParams: Record<string, string> = {};
    if (params?.tenant_id) queryParams.tenant_id = params.tenant_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.role) queryParams.role = params.role;
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.page_size) queryParams.page_size = params.page_size.toString();

    return apiClient.get<PaginatedResponse<User>>('/users', queryParams);
  }

  async getUser(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async createUser(data: UserCreateRequest): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<void> {
    return apiClient.patch(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }

  // Current tenant/campus context
  async getCurrentTenant(): Promise<Tenant> {
    return apiClient.get<Tenant>('/tenants/current');
  }

  async getCurrentCampus(): Promise<Campus> {
    return apiClient.get<Campus>('/campuses/current');
  }

  async switchCampus(campusId: number): Promise<void> {
    return apiClient.post('/users/switch-campus', { campus_id: campusId });
  }

  // Tenant statistics
  async getTenantStats(tenantId?: number): Promise<{
    tenant_id: number;
    total_campuses: number;
    active_campuses: number;
    total_users: number;
    active_users: number;
    total_frameworks: number;
    published_frameworks: number;
    users_by_role: Record<string, number>;
    frameworks_by_status: Record<string, number>;
    recent_activity: Array<{
      type: string;
      description: string;
      timestamp: string;
      user_name: string;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (tenantId) queryParams.tenant_id = tenantId.toString();

    return apiClient.get('/tenants/stats', queryParams);
  }

  // Campus statistics
  async getCampusStats(campusId?: number): Promise<{
    campus_id: number;
    total_users: number;
    active_users: number;
    total_classes: number;
    active_classes: number;
    total_students: number;
    mapped_frameworks: number;
    users_by_role: Record<string, number>;
    classes_by_status: Record<string, number>;
    recent_activity: Array<{
      type: string;
      description: string;
      timestamp: string;
      user_name: string;
    }>;
  }> {
    const queryParams: Record<string, string> = {};
    if (campusId) queryParams.campus_id = campusId.toString();

    return apiClient.get('/campuses/stats', queryParams);
  }

  // Bulk operations
  async bulkCreateUsers(users: UserCreateRequest[]): Promise<{
    successful: User[];
    failed: Array<{
      data: UserCreateRequest;
      error: string;
    }>;
  }> {
    return apiClient.post('/users/bulk', { users });
  }

  async bulkUpdateUsers(updates: Array<{
    id: number;
    data: UserUpdateRequest;
  }>): Promise<{
    successful: number[];
    failed: Array<{
      id: number;
      error: string;
    }>;
  }> {
    return apiClient.post('/users/bulk-update', { updates });
  }

  async bulkCreateCampuses(campuses: CampusCreateRequest[]): Promise<{
    successful: Campus[];
    failed: Array<{
      data: CampusCreateRequest;
      error: string;
    }>;
  }> {
    return apiClient.post('/campuses/bulk', { campuses });
  }

  // Import/Export
  async exportUsers(params?: {
    tenant_id?: number;
    campus_id?: number;
    format?: 'csv' | 'xlsx';
  }): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.tenant_id) queryParams.tenant_id = params.tenant_id.toString();
    if (params?.campus_id) queryParams.campus_id = params.campus_id.toString();
    if (params?.format) queryParams.format = params.format;

    return apiClient.post('/users/export', queryParams);
  }

  async importUsers(file: File, options?: {
    tenant_id?: number;
    campus_id?: number;
    update_existing?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    failed: Array<{
      row: number;
      error: string;
    }>;
  }> {
    const metadata: Record<string, string> = {};
    if (options?.tenant_id) metadata.tenant_id = options.tenant_id.toString();
    if (options?.campus_id) metadata.campus_id = options.campus_id.toString();
    if (options?.update_existing) metadata.update_existing = 'true';

    return apiClient.uploadFile('/users/import', file, metadata);
  }

  // User preferences
  async updateUserPreferences(preferences: Record<string, unknown>): Promise<void> {
    return apiClient.patch('/users/preferences', { preferences });
  }

  async getUserPreferences(): Promise<Record<string, unknown>> {
    return apiClient.get('/users/preferences');
  }

  // Role management
  async getAvailableRoles(): Promise<Array<{
    role: string;
    display_name: string;
    description: string;
    permissions: string[];
  }>> {
    return apiClient.get('/roles');
  }

  async assignRole(userId: number, role: string): Promise<void> {
    return apiClient.post(`/users/${userId}/assign-role`, { role });
  }

  async revokeRole(userId: number, role: string): Promise<void> {
    return apiClient.post(`/users/${userId}/revoke-role`, { role });
  }
}

export const tenantService = new TenantService();