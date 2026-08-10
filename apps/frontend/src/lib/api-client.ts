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

// Shared in-flight refresh promises so concurrent 401s (e.g. multiple
// simultaneous uploads) all wait on the SAME refresh call and retry with
// the new token, instead of falling through and permanently failing when
// isRefreshing is already true.
let adminRefreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;
let userRefreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

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

        if (adminRefreshToken) {
          try {
            // If a refresh is already in flight, wait on that SAME promise
            // instead of skipping the retry (which used to happen whenever
            // isRefreshing was already true, e.g. during concurrent uploads).
            if (!isRefreshing) {
              isRefreshing = true;
              adminRefreshPromise = axios
                .post(
                  `${API_BASE_URL}/auth/refresh`,
                  { refreshToken: adminRefreshToken },
                  {
                    headers: {
                      Authorization: `Bearer ${adminRefreshToken}`,
                    },
                  }
                )
                .then((response) => {
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

                  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
                })
                .finally(() => {
                  isRefreshing = false;
                  adminRefreshPromise = null;
                });
            }

            const { accessToken: newAccessToken } = await (adminRefreshPromise as Promise<{ accessToken: string; refreshToken: string }>);

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('admin_session');
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        } else {
          localStorage.removeItem('admin_session');
          window.location.href = '/admin/login';
        }
      } else {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();

        if (refreshToken) {
          try {
            // If a refresh is already in flight (e.g. another file in the
            // same batch upload also hit a 401), wait on that SAME promise
            // instead of skipping the retry. Previously, any request that
            // hit this branch while isRefreshing was already true matched
            // neither condition below and fell through to a permanent
            // failure, even though a valid token was seconds away.
            if (!isRefreshing) {
              isRefreshing = true;
              userRefreshPromise = axios
                .post(
                  `${API_BASE_URL}/auth/refresh`,
                  { refreshToken },
                  {
                    headers: {
                      Authorization: `Bearer ${refreshToken}`,
                    },
                  }
                )
                .then((response) => {
                  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
                  setTokens(newAccessToken, newRefreshToken);
                  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
                })
                .finally(() => {
                  isRefreshing = false;
                  userRefreshPromise = null;
                });
            }

            const { accessToken: newAccessToken } = await (userRefreshPromise as Promise<{ accessToken: string; refreshToken: string }>);

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            logout();
            // remove auth_session as requested
            localStorage.removeItem('auth_session');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          logout();
          localStorage.removeItem('auth_session');
          window.location.href = '/login';
        }
      }
    }

    // Unwrap any error response into the ApiErrorResponse shape and throw it
    const errorData = error.response?.data;
    // The exception filter wraps Nest's structured payload in `message`.
    const exceptionPayload = errorData?.message;
    const errorCode = errorData?.errorCode || exceptionPayload?.errorCode;
    const message =
      typeof exceptionPayload === 'object' && !Array.isArray(exceptionPayload)
        ? exceptionPayload.message || exceptionPayload.error || 'An unknown error occurred'
        : exceptionPayload || error.message || 'An unknown error occurred';

    if (
      error.response?.status === 403 &&
      originalRequest &&
      originalRequest.url?.includes('/auth/login') &&
      errorCode === 'EMAIL_NOT_VERIFIED'
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
      return new Promise(() => { }); // Halt execution to prevent login screen error toasts
    }

    const apiError: ApiErrorResponse = {
      statusCode: errorData?.statusCode || error.response?.status || 500,
      path: errorData?.path || originalRequest?.url || '',
      timestamp: errorData?.timestamp || new Date().toISOString(),
      message,
    };

    throw apiError;
  }
);

export default apiClient;