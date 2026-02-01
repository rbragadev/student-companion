export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  destination: {
    city: string;
    country: string;
  };
  purpose: string;
  budget?: {
    accommodation?: string;
    course?: string;
  };
  englishLevel?: string;
  arrivalDate?: string;
  hasUnreadNotifications: boolean;
  notificationCount: number;
}