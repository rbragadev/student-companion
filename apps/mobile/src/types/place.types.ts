export type PlaceCategory =
  | 'bars'
  | 'restaurants'
  | 'cafes'
  | 'parks'
  | 'museums'
  | 'shopping'
  | 'nightlife'
  | 'sports';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  image: string;
  images: string[];
  badges: string[];
  rating: number;
  ratingCount: number;
  address: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isStudentFavorite?: boolean;
  hasDeal?: boolean;
  dealDescription?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  description?: string;
  hours?: Record<string, string>;
  phone?: string;
  website?: string;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
