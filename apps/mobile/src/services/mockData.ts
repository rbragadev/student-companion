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
  ratingCount?: number;
  features?: string[];
  distance?: string;
  isTopTrip?: boolean;
  isPartner?: boolean;
  accommodationType?: 'Homestay' | 'Shared' | 'Studio' | 'Apartment';
  areaHint?: string;
}

export interface AccommodationDetail {
  id: string;
  title: string;
  images: string[];
  accommodationType: 'Homestay' | 'Shared' | 'Studio' | 'Apartment';
  price: string;
  priceUnit: string;
  location: string;
  areaHint: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description: string;
  rules: string[];
  amenities: string[];
  rating: {
    overall: number;
    count: number;
    dimensions: {
      cleanliness: number;
      location: number;
      communication: number;
      value: number;
    };
  };
  reviews: {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    date: string;
    comment: string;
  }[];
  goodFor: string;
  isPartner: boolean;
  hostName: string;
  hostAvatar: string;
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

// Simula uma chamada à API que retorna todas as acomodações
export const getAccommodations = async (): Promise<Recommendation[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return [
    // Top Trips
    {
      id: 'acc-1',
      type: 'accommodation',
      title: 'RedFish Lake',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      location: 'Idaho',
      price: '$40',
      priceUnit: 'Visit',
      rating: 4.5,
      ratingCount: 128,
      isTopTrip: true,
      isPartner: false,
      accommodationType: 'Homestay',
      areaHint: 'Near University District',
    },
    {
      id: 'acc-2',
      type: 'accommodation',
      title: 'Maligne Lake',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      location: 'Canada',
      price: '$40',
      priceUnit: 'Visit',
      rating: 4.5,
      ratingCount: 95,
      isTopTrip: true,
      isPartner: true,
      accommodationType: 'Shared',
      areaHint: 'Downtown Vancouver',
    },
    {
      id: 'acc-3',
      type: 'accommodation',
      title: 'Lake Louise',
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
      location: 'Canada',
      price: '$45',
      priceUnit: 'Visit',
      rating: 4.8,
      ratingCount: 210,
      isTopTrip: true,
      isPartner: true,
      accommodationType: 'Studio',
      areaHint: 'Kitsilano Beach Area',
    },
    // Outras acomodações
    {
      id: 'acc-4',
      type: 'accommodation',
      title: 'Cozy Kitsilano Homestay',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      location: 'Kitsilano',
      price: 'CAD 1,150',
      priceUnit: 'month',
      rating: 4.5,
      ratingCount: 42,
      isTopTrip: false,
      isPartner: true,
      accommodationType: 'Homestay',
      areaHint: 'Residential area, near beach',
      badge: 'Good fit for ESL students',
    },
    {
      id: 'acc-5',
      type: 'accommodation',
      title: 'Downtown Shared Suite',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      location: 'Vancouver Downtown',
      price: 'CAD 850',
      priceUnit: 'month',
      rating: 4.3,
      ratingCount: 67,
      isTopTrip: false,
      isPartner: false,
      accommodationType: 'Shared',
      areaHint: 'Heart of downtown',
    },
    {
      id: 'acc-6',
      type: 'accommodation',
      title: 'Modern Studio Apartment',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      location: 'Yaletown',
      price: 'CAD 1,800',
      priceUnit: 'month',
      rating: 4.7,
      ratingCount: 89,
      isTopTrip: false,
      isPartner: true,
      accommodationType: 'Studio',
      areaHint: 'Trendy neighborhood',
      badge: 'Recently renovated',
    },
    {
      id: 'acc-7',
      type: 'accommodation',
      title: 'West End Family Home',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      location: 'West End',
      price: 'CAD 1,250',
      priceUnit: 'month',
      rating: 4.6,
      ratingCount: 55,
      isTopTrip: false,
      isPartner: true,
      accommodationType: 'Homestay',
      areaHint: 'Close to Stanley Park',
    },
    {
      id: 'acc-8',
      type: 'accommodation',
      title: 'Spacious Shared House',
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop',
      location: 'Main Street',
      price: 'CAD 950',
      priceUnit: 'month',
      rating: 4.2,
      ratingCount: 38,
      isTopTrip: false,
      isPartner: false,
      accommodationType: 'Shared',
      areaHint: 'Hip area with cafes',
    },
  ];
};

// Simula uma chamada à API que retorna detalhes de uma acomodação
export const getAccommodationDetail = async (id: string): Promise<AccommodationDetail> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Mock data - em produção viria da API baseado no ID
  return {
    id,
    title: 'Cozy Kitsilano Homestay',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    ],
    accommodationType: 'Homestay',
    price: 'CAD 1,150',
    priceUnit: 'month',
    location: 'Kitsilano',
    areaHint: 'Residential area, near beach',
    coordinates: {
      latitude: 49.2688,
      longitude: -123.1721,
    },
    description: 'Welcome to our cozy homestay in the heart of Kitsilano! Perfect for international students looking for a comfortable and welcoming environment. Walking distance to the beach, local shops, and great transit connections.',
    rules: [
      'No smoking inside the house',
      'Quiet hours from 10 PM to 7 AM',
      'Guests must be approved in advance',
      'Keep common areas tidy',
      'Respect house rules and other residents',
    ],
    amenities: [
      'Wi-Fi included',
      'Shared kitchen',
      'Laundry facilities',
      'Parking available',
      'Bike storage',
      'Study area',
    ],
    rating: {
      overall: 4.5,
      count: 42,
      dimensions: {
        cleanliness: 4.7,
        location: 4.8,
        communication: 4.5,
        value: 4.2,
      },
    },
    reviews: [
      {
        id: 'rev-1',
        userName: 'Maria Silva',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Maria',
        rating: 5,
        date: '2024-01-15',
        comment: 'Amazing homestay! The family is very welcoming and the location is perfect for students. Close to everything you need.',
      },
      {
        id: 'rev-2',
        userName: 'John Park',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=John',
        rating: 4,
        date: '2023-12-10',
        comment: 'Great place to stay. Very clean and comfortable. The only downside is the shared bathroom, but overall highly recommended.',
      },
      {
        id: 'rev-3',
        userName: 'Sophie Chen',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sophie',
        rating: 5,
        date: '2023-11-22',
        comment: 'Perfect for ESL students! The host helped me practice English and made me feel at home. Great neighborhood too.',
      },
    ],
    goodFor: 'ESL students looking for a supportive environment to practice English. Perfect for those who want to experience Canadian family life while being close to the beach and good transit connections.',
    isPartner: true,
    hostName: 'Jennifer Thompson',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jennifer',
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

// Hook para usar todas as acomodações
export const useAccommodations = () => {
  const [accommodations, setAccommodations] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getAccommodations().then(data => {
      setAccommodations(data);
      setLoading(false);
    });
  }, []);

  const topTrips = accommodations.filter(acc => acc.isTopTrip);
  const otherAccommodations = accommodations.filter(acc => !acc.isTopTrip);

  return { accommodations, topTrips, otherAccommodations, loading };
};

// Exporta React para os hooks
import React from 'react';
