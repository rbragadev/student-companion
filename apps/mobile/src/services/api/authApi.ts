import { apiClient } from './client';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    phone: string | null;
    preferences: {
      destinationCity: string;
      destinationCountry: string;
      purpose: string;
      englishLevel: string | null;
      hasUnreadNotifications: boolean;
      notificationCount: number;
    } | null;
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },
};
