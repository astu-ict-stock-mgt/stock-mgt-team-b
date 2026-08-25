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

// Format API error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data) {
      const responseData = error.response.data as {
        status?: string;
        message?: string;
        errors?: Record<string, string>;
      };
      const message = responseData.message || 'An unexpected API error occurred';
      const customError = new Error(message) as Error & {
        statusCode?: number;
        status?: string;
        errors?: Record<string, string>;
      };
      customError.statusCode = error.response.status;
      customError.status = responseData.status;
      customError.errors = responseData.errors;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
