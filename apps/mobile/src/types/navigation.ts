// Tipos de navegação para o app

export type RootTabParamList = {
  Home: undefined;
  Copilot: { intent?: 'accommodation' | 'courses' | 'general' };
  Acomodação: undefined;
  Cursos: undefined;
  Perfil: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
