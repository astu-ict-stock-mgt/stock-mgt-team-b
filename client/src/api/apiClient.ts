import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject Bearer token into outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let lastSessionExpiredNotification = 0;

const notifySessionExpired = (message?: string) => {
  const now = Date.now();
  // Prevent duplicate broadcasts within 3 seconds
  if (now - lastSessionExpiredNotification > 3000) {
    lastSessionExpiredNotification = now;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:session-expired', {
          detail: {
            message:
              message ||
              'Your active session has expired for security reasons. Please log in again to continue your work safely.',
          },
        })
      );
    }
  }
};

// Format API error messages and handle session expirations
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const isLoginRequest = Boolean(error.config?.url?.includes('/auth/login'));
      const responseData = error.response.data as
        | {
            status?: string;
            message?: string;
            errors?: Record<string, string>;
          }
        | undefined;
      const message = responseData?.message || 'An unexpected API error occurred';

      // Non-login 401 means expired session or unauthorized token
      if (error.response.status === 401 && !isLoginRequest) {
        notifySessionExpired(responseData?.message);
      }

      const customError = new Error(message) as Error & {
        statusCode?: number;
        status?: string;
        errors?: Record<string, string>;
      };
      customError.statusCode = error.response.status;
      customError.status = responseData?.status;
      customError.errors = responseData?.errors;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
