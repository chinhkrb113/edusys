import { apiClient } from '../lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    tenant_id: number;
    campus_id: number;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: string;
  campus_id: number;
  created_at: string;
  last_login_at: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse | null> {
    console.log('🔐 [AUTH_SERVICE] login() called with:', { email: credentials.email, password: '***' });

    console.log('📡 [AUTH_SERVICE] Calling apiClient.post(/auth/login)...');
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    console.log('📨 [AUTH_SERVICE] apiClient.post() response:', response);

    if (response) {
      console.log('💾 [AUTH_SERVICE] Storing tokens in localStorage...');
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      console.log('✅ [AUTH_SERVICE] Tokens stored successfully');

      console.log('🎯 [AUTH_SERVICE] Returning login response data');
      return response;
    }

    console.error('❌ [AUTH_SERVICE] No response data, throwing error');
    throw new Error('Login failed');
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    if (response.data) {
      // Update tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      return response.data;
    }
    throw new Error(response.error || 'Token refresh failed');
  },

  async logout(): Promise<void> {
    const response = await apiClient.post('/auth/logout');
    // Clear tokens regardless of response
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (response.error) {
      throw new Error(response.error);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    if (response.data) {
      return response.data.user;
    }
    throw new Error(response.error || 'Failed to get user info');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};