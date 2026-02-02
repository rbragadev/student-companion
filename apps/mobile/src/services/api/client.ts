/**
 * Axios HTTP Client
 * Configured with interceptors for authentication and error handling
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from './config';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds authentication token to all requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    // TODO: Uncomment when implementing auth
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles global error responses and unwraps data envelope
 */
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] Response: ${response.config.url}`, response.status);
    }
    
    // Desencapsula o formato { statusCode, message, data }
    // Retorna apenas o data para manter a compatibilidade com o código existente
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('[API] Error:', error.message);
      
      // Log do erro encapsulado do backend
      if (error.response?.data) {
        console.error('[API] Error details:', error.response.data);
      }
    }

    // TODO: Add global error handling
    // - 401: Redirect to login
    // - 500: Show error toast
    // - Network error: Show offline message
    
    return Promise.reject(error);
  }
);
