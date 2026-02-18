import apiClient from './axios';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '@/types/auth';
import { JobsResponse, Job, ScoringHistory } from '@/types/job';

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Registration failed');
    }
    return response.data.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Login failed');
    }
    return response.data.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Clear auth on client side
    // Backend doesn't have logout endpoint, so we just clear client state
    return Promise.resolve();
  },
};

export const jobsApi = {
  /**
   * Get all jobs for authenticated user with filters
   */
  async getAll(
    skip?: number,
    take?: number,
    filters?: {
      status?: string | string[];
      minScore?: number;
      maxScore?: number;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ): Promise<JobsResponse> {
    const params = new URLSearchParams();
    if (skip !== undefined) {
      params.append('skip', skip.toString());
    }
    if (take !== undefined) {
      params.append('take', take.toString());
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((s) => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    if (filters?.minScore !== undefined) {
      params.append('minScore', filters.minScore.toString());
    }
    if (filters?.maxScore !== undefined) {
      params.append('maxScore', filters.maxScore.toString());
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    const queryString = params.toString();
    const url = `/jobs${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<JobsResponse>(url);
    return response.data;
  },

  /**
   * Search jobs by query string
   */
  async search(query: string, skip?: number, take?: number): Promise<JobsResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (skip !== undefined) {
      params.append('skip', skip.toString());
    }
    if (take !== undefined) {
      params.append('take', take.toString());
    }
    const response = await apiClient.get<JobsResponse>(`/jobs/search?${params.toString()}`);
    return response.data;
  },

  /**
   * Get job by ID
   */
  async getById(id: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Trigger manual job fetch
   */
  async fetchJobs(): Promise<{
    success: boolean;
    message: string;
    data: {
      fetched: number;
      saved: number;
      queued: number;
      pendingUpgrade: number;
      errors: string[];
    };
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        fetched: number;
        saved: number;
        queued: number;
        pendingUpgrade: number;
        errors: string[];
      };
    }>('/jobs/fetch');
    return response.data;
  },
  /**
   * Get scoring history for a job
   */
  async getHistory(id: string): Promise<{ success: boolean; data: ScoringHistory[] }> {
    const response = await apiClient.get<{ success: boolean; data: ScoringHistory[] }>(
      `/jobs/${id}/history`
    );
    return response.data;
  },
};

export interface AnalyticsOverview {
  totalJobs: number;
  averageScore: number | null;
  jobsByStatus: {
    new: number;
    queued: number;
    scored: number;
    archived: number;
  };
  jobsPerDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ScoreDistribution {
  ranges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export const analyticsApi = {
  getOverview: async (): Promise<{ success: boolean; data: AnalyticsOverview }> => {
    const response = await apiClient.get<{ success: boolean; data: AnalyticsOverview }>(
      '/analytics/overview'
    );
    return response.data;
  },
  getScoreDistribution: async (): Promise<{ success: boolean; data: ScoreDistribution }> => {
    const response = await apiClient.get<{ success: boolean; data: ScoreDistribution }>(
      '/analytics/score-distribution'
    );
    return response.data;
  },
};

export interface CreateCheckoutSessionDto {
  plan: 'pro' | 'enterprise';
  successUrl: string;
  cancelUrl: string;
}

export const billingApi = {
  createCheckoutSession: async (
    data: CreateCheckoutSessionDto
  ): Promise<{ success: boolean; data: { url: string } }> => {
    const response = await apiClient.post<{ success: boolean; data: { url: string } }>(
      '/billing/create-checkout-session',
      data
    );
    return response.data;
  },
};
