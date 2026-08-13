import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth-store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  const errorMsg = `[Configuration Error] "VITE_API_BASE_URL" is not defined. ` +
    `Please ensure your environment variables are configured correctly before running or building the application.`;
  console.error(
    `%c${errorMsg}`,
    'color: #ff3333; font-size: 14px; font-weight: bold; padding: 8px; border: 2px solid #ff3333; border-radius: 4px;'
  );
  throw new Error(errorMsg);
}

export const customerApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: Required to send/receive HTTP-Only cookies cross-origin
  withCredentials: true,
});

// Request interceptor to attach Bearer token
customerApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency lock state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

customerApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Prevent redirect loops on auth routes
    if (originalRequest && originalRequest.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh')
    )) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return customerApiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint. It will read the HTTP-only cookie automatically.
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.accessToken;
        
        // Update token in memory/Zustand store
        useAuthStore.getState().setTokens({ accessToken: newAccessToken });

        // Update header for current request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Process all queued requests with the new token
        processQueue(null, newAccessToken);
        
        return customerApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token expired)
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
