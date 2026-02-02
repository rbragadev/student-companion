// Mock API Data - Será substituído por chamadas reais posteriormente



export interface UserInterest {
  id: string;
  type: 'accommodation' | 'course';
  title: string;
  subtitle: string;
  date: string;
  status: 'pending' | 'contacted' | 'closed';
}

export interface UserReview {
  id: string;
  itemId: string;
  itemType: 'accommodation' | 'course' | 'place';
  itemName: string;
  rating: number;
  comment: string;
  date: string;
}

export type PlaceCategory = 'bars' | 'restaurants' | 'cafes' | 'parks' | 'museums' | 'shopping' | 'nightlife' | 'sports';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  image: string;
  rating: number;
  ratingCount: number;
  address: string;
  neighborhood: string;
  isStudentFavorite?: boolean;
  hasDeal?: boolean;
  dealDescription?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
}

export interface PlaceDetail extends Place {
  images: string[];
  description: string;
  hours: {
    [key: string]: string; // e.g., "monday": "9:00 AM - 10:00 PM"
  };
  phone?: string;
  website?: string;
  amenities: string[];
  reviews: {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    date: string;
    comment: string;
    replies?: {
      id: string;
      userName: string;
      userAvatar: string;
      comment: string;
      date: string;
    }[];
  }[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CopilotRecommendation {
  id: string;
  type: 'accommodation' | 'course';
  title: string;
  subtitle: string;
  image: string;
  price?: string;
  rating?: number;
  highlights: string[];
}

export interface CopilotResponse {
  summary: string;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  recommendations: CopilotRecommendation[];
  confidence: 'high' | 'medium' | 'low';
  missingInfo?: string[];
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



// Simula uma chamada à API que retorna interesses/leads do usuário
export const getUserInterests = async (): Promise<UserInterest[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: '1',
      type: 'accommodation',
      title: 'Cozy Homestay in Vancouver',
      subtitle: 'Sent inquiry on Jan 15, 2026',
      date: '2026-01-15',
      status: 'pending',
    },
    {
      id: '2',
      type: 'course',
      title: 'ILSC Vancouver - General English',
      subtitle: 'Enrollment request sent',
      date: '2026-01-20',
      status: 'contacted',
    },
    {
      id: '3',
      type: 'accommodation',
      title: 'Modern Studio Downtown',
      subtitle: 'Application completed',
      date: '2026-01-10',
      status: 'closed',
    },
  ];
};

// Simula uma chamada à API que retorna avaliações do usuário
export const getUserReviews = async (): Promise<UserReview[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: '1',
      itemId: 'acc-1',
      itemType: 'accommodation',
      itemName: 'Shared House in Kitsilano',
      rating: 5,
      comment: 'Great place! Very clean and the host was super helpful. Would definitely recommend.',
      date: '2025-12-20',
    },
    {
      id: '2',
      itemId: 'course-1',
      itemType: 'course',
      itemName: 'EC English - IELTS Preparation',
      rating: 4,
      comment: 'Good program overall. Teachers are experienced and the school has good facilities.',
      date: '2025-11-15',
    },
  ];
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
import { UserProfile } from '../types/user.types';

// Simula uma chamada à API que retorna places
export const getPlaces = async (): Promise<Place[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: '1',
      name: 'The Charles Bar',
      category: 'bars',
      image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop',
      rating: 4.6,
      ratingCount: 324,
      address: '136 Cordova St W',
      neighborhood: 'Gastown',
      isStudentFavorite: true,
      hasDeal: true,
      dealDescription: '20% off for students',
      priceRange: '$$',
    },
    {
      id: '2',
      name: 'Granville Island Public Market',
      category: 'shopping',
      image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop',
      rating: 4.8,
      ratingCount: 892,
      address: '1661 Duranleau St',
      neighborhood: 'Granville Island',
      isStudentFavorite: true,
      priceRange: '$$',
    },
    {
      id: '3',
      name: 'Stanley Park Seawall',
      category: 'parks',
      image: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&h=600&fit=crop',
      rating: 4.9,
      ratingCount: 1205,
      address: 'Stanley Park Dr',
      neighborhood: 'Downtown',
      isStudentFavorite: true,
      priceRange: '$',
    },
    {
      id: '4',
      name: 'Medina Cafe',
      category: 'cafes',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
      rating: 4.7,
      ratingCount: 456,
      address: '780 Richards St',
      neighborhood: 'Downtown',
      hasDeal: true,
      dealDescription: 'Free coffee with breakfast',
      priceRange: '$$',
    },
    {
      id: '5',
      name: 'Science World',
      category: 'museums',
      image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop',
      rating: 4.5,
      ratingCount: 678,
      address: '1455 Quebec St',
      neighborhood: 'False Creek',
      hasDeal: true,
      dealDescription: 'Student discount available',
      priceRange: '$$',
    },
    {
      id: '6',
      name: 'Vij\'s Restaurant',
      category: 'restaurants',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      rating: 4.8,
      ratingCount: 543,
      address: '3106 Cambie St',
      neighborhood: 'Cambie Village',
      isStudentFavorite: true,
      priceRange: '$$$',
    },
    {
      id: '7',
      name: 'Celebrities Nightclub',
      category: 'nightlife',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
      rating: 4.4,
      ratingCount: 289,
      address: '1022 Davie St',
      neighborhood: 'West End',
      hasDeal: true,
      dealDescription: 'Free entry before 11pm with student ID',
      priceRange: '$$',
    },
    {
      id: '8',
      name: 'Kitsilano Beach',
      category: 'parks',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      rating: 4.7,
      ratingCount: 892,
      address: 'Cornwall Ave',
      neighborhood: 'Kitsilano',
      isStudentFavorite: true,
      priceRange: '$',
    },
  ];
};

// Simula uma chamada à API que retorna detalhes de um place
export const getPlaceDetail = async (id: string): Promise<PlaceDetail> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id,
    name: 'The Charles Bar',
    category: 'bars',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop',
    rating: 4.6,
    ratingCount: 324,
    address: '136 Cordova St W',
    neighborhood: 'Gastown',
    isStudentFavorite: true,
    hasDeal: true,
    dealDescription: '20% off for students on Wednesdays',
    priceRange: '$$',
    images: [
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=600&fit=crop',
    ],
    description: 'A cozy neighborhood bar in the heart of Gastown. Perfect spot for students to meet, chat, and enjoy great drinks at affordable prices. Known for its friendly atmosphere and regular student nights.',
    hours: {
      monday: '5:00 PM - 12:00 AM',
      tuesday: '5:00 PM - 12:00 AM',
      wednesday: '5:00 PM - 2:00 AM',
      thursday: '5:00 PM - 2:00 AM',
      friday: '5:00 PM - 2:00 AM',
      saturday: '2:00 PM - 2:00 AM',
      sunday: '2:00 PM - 12:00 AM',
    },
    phone: '+1 (604) 555-0199',
    website: 'www.thecharlesbar.com',
    amenities: ['Free WiFi', 'Student Discounts', 'Happy Hour', 'Live Music', 'Outdoor Seating', 'Late Night Food'],
    reviews: [
      {
        id: '1',
        userName: 'Sarah Johnson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah',
        rating: 5,
        date: 'Jan 2026',
        comment: 'Love this place! Great atmosphere and the student discount on Wednesdays is amazing. Perfect spot to hang out with friends after class.',
        replies: [
          {
            id: 'r1',
            userName: 'The Charles Bar',
            userAvatar: 'https://api.dicebear.com/7.x/initials/png?seed=TCB',
            comment: 'Thanks Sarah! We love having you here. See you next Wednesday! 🍻',
            date: 'Jan 2026',
          },
        ],
      },
      {
        id: '2',
        userName: 'Mike Chen',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mike',
        rating: 4,
        date: 'Dec 2025',
        comment: 'Good selection of beers and friendly staff. Can get crowded on weekends but that\'s expected. Prices are reasonable.',
        replies: [],
      },
      {
        id: '3',
        userName: 'Emma Wilson',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Emma',
        rating: 5,
        date: 'Dec 2025',
        comment: 'Best bar in Gastown! The live music on Thursdays is always great and the bartenders really know their stuff. Highly recommend!',
        replies: [
          {
            id: 'r2',
            userName: 'Mike Chen',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mike',
            comment: 'Totally agree! The Thursday live music nights are the best.',
            date: 'Dec 2025',
          },
        ],
      },
    ],
    coordinates: {
      latitude: 49.2839,
      longitude: -123.1094,
    },
  };
};

// Hook para usar interesses do usuário
export const useUserInterests = () => {
  const [interests, setInterests] = React.useState<UserInterest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserInterests().then(data => {
      setInterests(data);
      setLoading(false);
    });
  }, []);

  return { interests, loading };
};

// Hook para usar avaliações do usuário
export const useUserReviews = () => {
  const [reviews, setReviews] = React.useState<UserReview[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserReviews().then(data => {
      setReviews(data);
      setLoading(false);
    });
  }, []);

  return { reviews, loading };
};

// Hook para usar places
export const usePlaces = () => {
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getPlaces().then(data => {
      setPlaces(data);
      setLoading(false);
    });
  }, []);

  return { places, loading };
};

// Simula uma chamada à API do Copilot
const getCopilotResponse = async (question: string): Promise<CopilotResponse> => {
  // Simula delay de IA
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Detecta o tipo de pergunta e retorna resposta apropriada
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('morar') || lowerQuestion.includes('accommodation') || lowerQuestion.includes('1200')) {
    return {
      summary: 'Based on your budget of CAD 1,200/month, you have good options in Vancouver. Homestays and shared accommodations are the most affordable choices, offering a balance between cost and comfort.',
      tradeoffs: {
        pros: [
          'Homestays include meals and utilities',
          'Shared houses offer more independence',
          'Both options help you save for other expenses',
          'Great way to meet other students',
        ],
        cons: [
          'Less privacy in shared spaces',
          'Homestay rules can be restrictive',
          'May need to commute to school',
          'Limited kitchen access in some homestays',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'accommodation',
          title: 'Cozy Homestay in Vancouver',
          subtitle: 'Kitsilano • Meals included',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          price: 'CAD 950/month',
          rating: 4.7,
          highlights: ['3 meals/day', 'WiFi included', '20min to downtown'],
        },
        {
          id: '2',
          type: 'accommodation',
          title: 'Shared House Downtown',
          subtitle: 'West End • Fully furnished',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          price: 'CAD 1,150/month',
          rating: 4.5,
          highlights: ['Private bedroom', 'Shared kitchen', 'Walking distance to schools'],
        },
        {
          id: '3',
          type: 'accommodation',
          title: 'Student Residence',
          subtitle: 'Mount Pleasant • All utilities',
          image: 'https://images.unsplash.com/photo-1502672260066-6bc36a0d5c01?w=400&h=300&fit=crop',
          price: 'CAD 1,200/month',
          rating: 4.6,
          highlights: ['Utilities included', 'Study lounge', 'International community'],
        },
      ],
      confidence: 'high',
    };
  }

  if (lowerQuestion.includes('escola') || lowerQuestion.includes('school') || lowerQuestion.includes('worth') || lowerQuestion.includes('custo')) {
    return {
      summary: 'When choosing a school, consider factors beyond just price: teacher quality, class size, location, and student reviews are crucial. The best value schools offer a balance of affordability and quality education.',
      tradeoffs: {
        pros: [
          'Smaller schools offer personalized attention',
          'Partner schools provide exclusive deals',
          'Downtown locations save commute time',
          'Accredited schools ensure quality standards',
        ],
        cons: [
          'Premium schools can be expensive',
          'Cheaper schools may have larger classes',
          'Location affects overall cost of living',
          'Not all schools offer flexible schedules',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'course',
          title: 'ILSC Vancouver',
          subtitle: 'General English - Full Time',
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
          price: 'CAD 1,450/month',
          rating: 4.8,
          highlights: ['28h/week', 'Small classes', 'Downtown location'],
        },
        {
          id: '2',
          type: 'course',
          title: 'VanWest College',
          subtitle: 'Business English',
          image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop',
          price: 'CAD 1,320/month',
          rating: 4.7,
          highlights: ['25h/week', 'Career focused', 'Student discounts'],
        },
        {
          id: '3',
          type: 'course',
          title: 'ILAC Vancouver',
          subtitle: 'Pathway Program',
          image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop',
          price: 'CAD 1,890/month',
          rating: 4.8,
          highlights: ['38h/week', 'University pathway', 'Intensive program'],
        },
      ],
      confidence: 'high',
    };
  }

  if (lowerQuestion.includes('homestay') && lowerQuestion.includes('shared')) {
    return {
      summary: 'Both options have their merits. Homestays are ideal for cultural immersion and included meals, while shared houses offer more independence and flexibility. Your choice depends on your lifestyle preferences and budget.',
      tradeoffs: {
        pros: [
          'Homestay: Cultural immersion and language practice',
          'Homestay: Meals and utilities typically included',
          'Shared: More independence and flexibility',
          'Shared: Often closer to nightlife and student areas',
        ],
        cons: [
          'Homestay: House rules and curfews',
          'Homestay: Less social interaction with peers',
          'Shared: Need to cook and clean',
          'Shared: Utility bills not always included',
        ],
      },
      recommendations: [
        {
          id: '1',
          type: 'accommodation',
          title: 'Premium Homestay',
          subtitle: 'North Vancouver • Full board',
          image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          price: 'CAD 1,100/month',
          rating: 4.8,
          highlights: ['All meals', 'Private room', 'Quiet neighborhood'],
        },
        {
          id: '2',
          type: 'accommodation',
          title: 'Modern Shared House',
          subtitle: 'Kitsilano • Beachside',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
          price: 'CAD 1,250/month',
          rating: 4.6,
          highlights: ['Near beach', '4 roommates', 'Fully equipped'],
        },
        {
          id: '3',
          type: 'accommodation',
          title: 'Hybrid Option',
          subtitle: 'West End • Best of both',
          image: 'https://images.unsplash.com/photo-1502672260066-6bc36a0d5c01?w=400&h=300&fit=crop',
          price: 'CAD 1,180/month',
          rating: 4.7,
          highlights: ['Breakfast included', 'Independent living', 'Central location'],
        },
      ],
      confidence: 'high',
    };
  }

  // Resposta genérica com baixa confiança
  return {
    summary: 'I need more information to give you the best recommendations. Please provide more details about your preferences and situation.',
    tradeoffs: {
      pros: [],
      cons: [],
    },
    recommendations: [],
    confidence: 'low',
    missingInfo: [
      'What is your monthly budget?',
      'Are you looking for accommodation or courses?',
      'What area of Vancouver do you prefer?',
      'Do you have any specific requirements?',
    ],
  };
};

// Export da função para ser usada diretamente
export const askCopilot = getCopilotResponse;
