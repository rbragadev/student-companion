import axios, { AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { tokenStore } from './tokenStore';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] Response: ${response.config.url}`, response.status);
    }

    // Desencapsula o formato { statusCode, message, data }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }

    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('[API] Error:', error.message);
      if (error.response?.data) {
        console.error('[API] Error details:', error.response.data);
      }
    }

    if (error.response?.status === 401) {
      tokenStore.callUnauthorized();
    }

    return Promise.reject(error);
  },
);
