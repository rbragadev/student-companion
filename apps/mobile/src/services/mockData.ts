// Mock API Data - Será substituído por chamadas reais posteriormente

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  destination: {
    city: string;
    country: string;
  };
  purpose: string;
  hasUnreadNotifications: boolean;
  notificationCount: number;
}

export interface HeroContent {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaIntent: 'accommodation' | 'courses' | 'general';
}

// Simula uma chamada à API que retorna os dados do usuário
export const getUserProfile = async (): Promise<UserProfile> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id: '1',
    firstName: 'Raphael',
    lastName: 'Braga',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Raphael',
    destination: {
      city: 'Vancouver',
      country: 'Canada',
    },
    purpose: 'study English',
    hasUnreadNotifications: true,
    notificationCount: 3,
  };
};

// Simula uma chamada à API que retorna o conteúdo do Hero Card
export const getHeroContent = async (): Promise<HeroContent> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    image: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&h=600&fit=crop',
    title: 'Find the best accommodation for your profile',
    subtitle: 'Based on your budget, location and school',
    ctaText: 'Get recommendations',
    ctaIntent: 'accommodation',
  };
};

// Hook para usar os dados do usuário (por enquanto retorna dados mock)
export const useUserProfile = () => {
  // TODO: Substituir por React Query ou similar quando integrar com API real
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserProfile().then(data => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  return { user, loading };
};

// Hook para usar o conteúdo do Hero Card
export const useHeroContent = () => {
  const [content, setContent] = React.useState<HeroContent | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getHeroContent().then(data => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  return { content, loading };
};

// Exporta React para os hooks
import React from 'react';
