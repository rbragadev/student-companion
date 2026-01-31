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

export interface Recommendation {
  id: string;
  type: 'accommodation' | 'course';
  title: string;
  image: string;
  badge?: string;
  location?: string;
  price?: string;
  priceUnit?: string;
  rating?: number;
  features?: string[];
  distance?: string;
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

// Simula uma chamada à API que retorna recomendações personalizadas
export const getRecommendations = async (): Promise<Recommendation[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: '1',
      type: 'accommodation',
      title: 'Kitsilano Homestay',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      badge: 'Good fit for ESL students',
      location: 'Kitsilano',
      price: 'CAD 1,150',
      priceUnit: 'month',
      rating: 4.5,
      features: ['🇨🇦', '📚', '1'],
      distance: '20 min to school',
    },
    {
      id: '2',
      type: 'accommodation',
      title: 'Vancouver Shared Apartment',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      badge: 'Good fit for ESL students',
      location: 'Vancouver Downtown',
      price: 'CAD 40',
      priceUnit: 'week',
      rating: 4.3,
      features: ['🏙️'],
      distance: '10 min to school',
    },
    {
      id: '3',
      type: 'course',
      title: 'ILSC Vancouver - Intensive English',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      badge: 'Oficial Partner',
      location: 'Richmond, BC',
      price: 'CAD 1,000',
      priceUnit: 'month',
      rating: 4.7,
      features: ['🇨🇦', '📚', '10'],
      distance: '20 min to school',
    },
  ];
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

// Hook para usar as recomendações
export const useRecommendations = () => {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getRecommendations().then(data => {
      setRecommendations(data);
      setLoading(false);
    });
  }, []);

  return { recommendations, loading };
};

// Exporta React para os hooks
import React from 'react';
