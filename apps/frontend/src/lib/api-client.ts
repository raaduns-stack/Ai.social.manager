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
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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

    // 1. On a 401, attempt to refresh tokens once (if we have a refresh token and haven't retried yet)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          // POST /auth/refresh with the stored refresh token.
          // We provide it in the body and in the Authorization header to be robust
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
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else if (!refreshToken) {
        logout();
        window.location.href = '/login';
      }
    }

    // 2. Unwrap any error response into the ApiErrorResponse shape and throw it
    const errorData = error.response?.data;
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
