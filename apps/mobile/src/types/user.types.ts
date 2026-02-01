export interface UserPreferences {
  id: string;
  userId: string;
  destinationCity: string;
  destinationCountry: string;
  budgetAccommodationMin?: number;
  budgetAccommodationMax?: number;
  budgetCourseMin?: number;
  budgetCourseMax?: number;
  purpose: string;
  englishLevel?: string;
  arrivalDate?: string;
  preferredAccommodationTypes: string[];
  maxDistanceToSchool?: number;
  hasUnreadNotifications: boolean;
  notificationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}