import { toast } from "@/hooks/use-toast";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';

// Types for API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

// HTTP Client with automatic token refresh
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    localStorage.setItem('access_token', accessToken);

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = fetch(`${this.baseURL}/api/${API_VERSION}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.saveTokens(data.access_token, data.refresh_token);
        return data.access_token;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api/${API_VERSION}${endpoint}`;
    console.log('🌐 [API_CLIENT] Making request to:', url);
    console.log('📋 [API_CLIENT] Method:', options.method || 'GET');
    console.log('🎯 [API_CLIENT] Endpoint:', endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if we have a token
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
      console.log('🔑 [API_CLIENT] Using access token');
    } else {
      console.log('🚫 [API_CLIENT] No access token');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    console.log('📤 [API_CLIENT] Sending request...');
    let response = await fetch(url, config);
    console.log('📥 [API_CLIENT] Response status:', response.status);

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken) {
      try {
        const newToken = await this.refreshAccessToken();
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    // Handle other error responses
    if (!response.ok) {
      console.log('❌ [API_CLIENT] Request failed with status:', response.status);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 [API_CLIENT] Error response data:', errorData);

      const error: ApiError = {
        message: errorData.message || 'An error occurred',
        code: errorData.code || 'UNKNOWN_ERROR',
        details: errorData.details,
      };

      console.log('🚨 [API_CLIENT] Throwing error:', error);

      // Show error toast for user-facing errors
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      throw error;
    }

    const data = await response.json();
    console.log('✅ [API_CLIENT] Request successful, returning data');
    return data;
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.makeRequest<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File, metadata?: Record<string, string>): Promise<T> {
    const url = `${this.baseURL}/api/${API_VERSION}${endpoint}`;

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  }

  // Authentication methods
  setTokens(accessToken: string, refreshToken: string) {
    this.saveTokens(accessToken, refreshToken);
  }

  logout() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export type { ApiClient };