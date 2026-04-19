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
  interestedInAccommodation?: boolean;
  accommodationTypePreference?: string;
  budgetPreference?: string;
  locationPreference?: string;
  notes?: string;
  maxDistanceToSchool?: number;
  hasUnreadNotifications: boolean;
  notificationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceOption {
  value: string;
  label: string;
}

export interface UserPreferenceOptions {
  accommodationTypeOptions: PreferenceOption[];
  budgetOptions: PreferenceOption[];
  locationOptions: PreferenceOption[];
  purposeOptions: PreferenceOption[];
  englishLevelOptions: PreferenceOption[];
}

export interface UpdateUserPreferencesPayload
  extends Partial<
    Pick<
      UserPreferences,
      | 'destinationCity'
      | 'destinationCountry'
      | 'budgetAccommodationMin'
      | 'budgetAccommodationMax'
      | 'budgetCourseMin'
      | 'budgetCourseMax'
      | 'purpose'
      | 'englishLevel'
      | 'arrivalDate'
      | 'preferredAccommodationTypes'
      | 'interestedInAccommodation'
      | 'accommodationTypePreference'
      | 'budgetPreference'
      | 'locationPreference'
      | 'notes'
      | 'maxDistanceToSchool'
    >
  > {}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  studentStatus: 'lead' | 'application_started' | 'pending_enrollment' | 'enrolled';
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}
