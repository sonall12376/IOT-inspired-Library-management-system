import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Request new tokens
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
          
          // Store new tokens
          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update authorization header of the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid -> log out user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new Event('auth_session_expired'));
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
