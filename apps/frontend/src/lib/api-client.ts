import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '@socialpilot/shared-types';
import { useAuthStore } from '../store/auth-store';

export type { ApiErrorResponse };

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const isAdminRequest = url.startsWith('/admin') || url.startsWith('/api/admin') || window.location.pathname.startsWith('/admin');

    if (isAdminRequest) {
      const adminSessionStr = localStorage.getItem('admin_session');
      if (adminSessionStr) {
        try {
          const adminSession = JSON.parse(adminSessionStr);
          if (adminSession?.accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${adminSession.accessToken}`;
          }
        } catch (e) {
          // ignore
        }
      }
    } else {
      const { accessToken } = useAuthStore.getState();
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to avoid infinite loops and multiple refresh requests
let isRefreshing = false;

// Response interceptor to handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config;

    if (originalRequest) {
      const url = originalRequest.url || '';
      
      // 2. PREVENT REDIRECT LOOPS
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/admin/login') // avoid loops on admin login too
      ) {
        throw error;
      }
    }

    // 1. On a 401, attempt to refresh tokens once (if we have a refresh token and haven't retried yet)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const url = originalRequest.url || '';
      const isAdminRequest = url.startsWith('/admin') || url.startsWith('/api/admin') || window.location.pathname.startsWith('/admin');

      if (isAdminRequest) {
        let adminRefreshToken: string | null = null;
        const adminSessionStr = localStorage.getItem('admin_session');
        if (adminSessionStr) {
          try {
            const adminSession = JSON.parse(adminSessionStr);
            adminRefreshToken = adminSession?.refreshToken || null;
          } catch (e) {
            // Ignore
          }
        }

        if (adminRefreshToken && !isRefreshing) {
          isRefreshing = true;
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken: adminRefreshToken },
              {
                headers: {
                  Authorization: `Bearer ${adminRefreshToken}`,
                },
              }
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

            if (adminSessionStr) {
              try {
                const adminSession = JSON.parse(adminSessionStr);
                adminSession.accessToken = newAccessToken;
                adminSession.refreshToken = newRefreshToken;
                localStorage.setItem('admin_session', JSON.stringify(adminSession));
              } catch (e) {
                // Ignore
              }
            }

            isRefreshing = false;

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            localStorage.removeItem('admin_session');
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        } else if (!adminRefreshToken) {
          localStorage.removeItem('admin_session');
          window.location.href = '/admin/login';
        }
      } else {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();

        if (refreshToken && !isRefreshing) {
          isRefreshing = true;
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken },
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
            setTokens(newAccessToken, newRefreshToken);
            isRefreshing = false;

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            logout();
            // remove auth_session as requested
            localStorage.removeItem('auth_session'); 
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else if (!refreshToken) {
          logout();
          localStorage.removeItem('auth_session');
          window.location.href = '/login';
        }
      }
    }

    // Unwrap any error response into the ApiErrorResponse shape and throw it
    const errorData = error.response?.data;

    if (
      error.response?.status === 403 &&
      originalRequest &&
      originalRequest.url?.includes('/auth/login') &&
      errorData?.errorCode === 'EMAIL_NOT_VERIFIED'
    ) {
      let email = '';
      try {
        const payload = typeof originalRequest.data === 'string'
          ? JSON.parse(originalRequest.data)
          : originalRequest.data;
        email = payload?.email || '';
      } catch (e) {
        // ignore
      }
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      return new Promise(() => {}); // Halt execution to prevent login screen error toasts
    }

    const apiError: ApiErrorResponse = {
      statusCode: errorData?.statusCode || error.response?.status || 500,
      path: errorData?.path || originalRequest?.url || '',
      timestamp: errorData?.timestamp || new Date().toISOString(),
      message: errorData?.message || error.message || 'An unknown error occurred',
    };

    throw apiError;
  }
);

export default apiClient;
