// Tipos de navegação para o app

export type RootStackParamList = {
  Home: undefined;
  Copilot: { intent?: 'accommodation' | 'courses' | 'general' };
  Acomodação: undefined;
  AccommodationDetail: { accommodationId: string };
  Cursos: undefined;
  Perfil: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
