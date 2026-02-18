export type UserRole = 'admin' | 'user';
export type TenantPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface User {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  subscriptionStatus: SubscriptionStatus | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}
