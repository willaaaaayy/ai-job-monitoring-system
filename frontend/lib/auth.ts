import Cookies from 'js-cookie';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export const authUtils = {
  /**
   * Set authentication token and user in cookies
   * Note: Token is also set by proxy route in httpOnly cookie
   */
  setAuth(token: string, user: { id: string; email: string; tenantId?: string; role?: string }): void {
    // Store user in localStorage for client-side access
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      // Set token in cookie for client-side access (proxy also sets httpOnly cookie)
      // Try both cookie names: auth_token (from proxy) and auth_token_client
      Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
      Cookies.set('auth_token_client', token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
    }
  },

  /**
   * Get authentication token from cookies (client-side only)
   * Tries multiple cookie names to support both httpOnly and regular cookies
   */
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    // Try auth_token_client first (set by proxy as non-httpOnly cookie)
    const clientToken = Cookies.get('auth_token_client');
    if (clientToken) {
      return clientToken;
    }
    // Try auth_token (set by js-cookie or proxy)
    const cookieToken = Cookies.get(AUTH_TOKEN_KEY);
    if (cookieToken) {
      return cookieToken;
    }
    // No token found
    return null;
  },

  /**
   * Get user from localStorage
   */
  getUser(): { id: string; email: string; tenantId?: string; role?: string } | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Remove authentication data
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      Cookies.remove(AUTH_TOKEN_KEY);
      Cookies.remove('auth_token_client');
      localStorage.removeItem(AUTH_USER_KEY);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!Cookies.get('auth_token_client') || !!Cookies.get(AUTH_TOKEN_KEY) || !!localStorage.getItem(AUTH_USER_KEY);
  },
};
