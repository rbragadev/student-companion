// Tipos de navegação para o app

import { NavigatorScreenParams } from '@react-navigation/native';

// Enums para as rotas (type-safe)
export enum TabRoutes {
  HOME = 'Home',
  COPILOT = 'Copilot',
  ACCOMMODATION = 'Acomodação',
  COURSES = 'Cursos',
  PROFILE = 'Perfil',
}

export enum StackRoutes {
  MAIN_TABS = 'MainTabs',
  ACCOMMODATION_DETAIL = 'AccommodationDetail',
}

// Tabs do navegador principal
export type RootTabParamList = {
  [TabRoutes.HOME]: undefined;
  [TabRoutes.COPILOT]: { intent?: 'accommodation' | 'courses' | 'general' };
  [TabRoutes.ACCOMMODATION]: undefined;
  [TabRoutes.COURSES]: undefined;
  [TabRoutes.PROFILE]: undefined;
};

// Stack principal que contém as tabs e telas modais
export type RootStackParamList = {
  [StackRoutes.MAIN_TABS]: NavigatorScreenParams<RootTabParamList>;
  [StackRoutes.ACCOMMODATION_DETAIL]: { accommodationId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
