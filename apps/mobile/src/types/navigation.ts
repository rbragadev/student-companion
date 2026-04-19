// Tipos de navegação para o app

import { NavigatorScreenParams } from '@react-navigation/native';

// Enums para as rotas (type-safe)
export enum TabRoutes {
  HOME = 'Home',
  COPILOT = 'Copilot',
  ACCOMMODATION = 'Acomodação',
  COURSES = 'Cursos',
  PLACES = 'Places',
}

export enum StackRoutes {
  MAIN_TABS = 'MainTabs',
  ACCOMMODATION_DETAIL = 'AccommodationDetail',
  ACCOMMODATION_CHECKOUT = 'AccommodationCheckout',
  COURSE_DETAIL = 'CourseDetail',
  ENROLLMENT_INTENT = 'EnrollmentIntent',
  ACADEMIC_JOURNEY = 'AcademicJourney',
  ENROLLMENT_DETAIL = 'EnrollmentDetail',
  ENROLLMENT_CHECKOUT = 'EnrollmentCheckout',
  NOTIFICATIONS = 'Notifications',
  PLACE_DETAIL = 'PlaceDetail',
  PROFILE = 'Profile',
  SETTINGS = 'Settings',
}

// Tabs do navegador principal
export type RootTabParamList = {
  [TabRoutes.HOME]: undefined;
  [TabRoutes.COPILOT]: { intent?: 'accommodation' | 'courses' | 'general' };
  [TabRoutes.ACCOMMODATION]: undefined;
  [TabRoutes.COURSES]: undefined;
  [TabRoutes.PLACES]: undefined;
};

// Stack principal que contém as tabs e telas modais
export type RootStackParamList = {
  [StackRoutes.MAIN_TABS]: NavigatorScreenParams<RootTabParamList>;
  [StackRoutes.ACCOMMODATION_DETAIL]: { accommodationId: string };
  [StackRoutes.ACCOMMODATION_CHECKOUT]: {
    accommodationId: string;
    intentId?: string;
    mode?: 'standalone' | 'package';
    initialStartDate?: string;
    initialEndDate?: string;
  };
  [StackRoutes.COURSE_DETAIL]: { courseId: string };
  [StackRoutes.ENROLLMENT_INTENT]: { courseId: string };
  [StackRoutes.ACADEMIC_JOURNEY]: undefined;
  [StackRoutes.ENROLLMENT_DETAIL]: { enrollmentId: string };
  [StackRoutes.ENROLLMENT_CHECKOUT]: { enrollmentId: string };
  [StackRoutes.NOTIFICATIONS]: undefined;
  [StackRoutes.PLACE_DETAIL]: { placeId: string };
  [StackRoutes.PROFILE]: undefined;
  [StackRoutes.SETTINGS]: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
