/**
 * Wrapper padrão de resposta da API
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Interface de Recomendação ALINHADA COM A API
 * Corresponde ao formato retornado por GET /recommendation/:userId
 */
export interface Recommendation {
  id: string;
  type: 'accommodation' | 'course' | 'place' | 'school';
  title: string;
  subtitle: string;  // Gerado pela strategy (ex: "Vancouver • $950/month")
  score: number;     // Score de recomendação (0-100)
  badge: string;     // Badge da entidade (ex: "Top Trip", "Partner")
  imageUrl: string;  // URL da imagem principal
  data: RecommendationData;  // Dados completos da entidade
}

/**
 * Dados completos de uma entidade recomendada
 * Pode ser Accommodation, Course, Place ou School
 */
export type RecommendationData = 
  | AccommodationData 
  | CourseData 
  | PlaceData 
  | SchoolData;

/**
 * Dados de Accommodation da API
 */
export interface AccommodationData {
  id: string;
  title: string;
  accommodationType: string;
  priceInCents: number;
  priceUnit: string;
  location: string;
  areaHint?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  rules: string[];
  amenities: string[];
  image: string;
  images: string[];
  rating?: number;
  ratingCount?: number;
  ratingCleanliness?: number;
  ratingLocation?: number;
  ratingCommunication?: number;
  ratingValue?: number;
  goodFor?: string;
  isPartner?: boolean;
  isTopTrip?: boolean;
  hostName?: string;
  hostAvatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados de Course da API
 */
export interface CourseData {
  id: string;
  schoolId: string;
  programName: string;
  weeklyHours: number;
  priceInCents?: number;
  description: string;
  duration: string;
  visaType: string;
  targetAudience: string;
  image: string;
  images: string[];
  badge?: string;
  rating?: number;
  ratingCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  school: {
    id: string;
    name: string;
    location: string;
    description?: string;
    website?: string;
    phone?: string;
    email?: string;
    logo?: string;
    isPartner: boolean;
  };
}

/**
 * Dados de Place da API
 */
export interface PlaceData {
  id: string;
  name: string;
  category: string;
  image: string;
  images: string[];
  rating?: number;
  ratingCount?: number;
  address: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  isStudentFavorite?: boolean;
  hasDeal?: boolean;
  dealDescription?: string;
  priceRange?: string;
  description?: string;
  hours?: any;
  phone?: string;
  website?: string;
  amenities: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados de School da API
 */
export interface SchoolData {
  id: string;
  name: string;
  location: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isPartner: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    courses: number;
  };
}
