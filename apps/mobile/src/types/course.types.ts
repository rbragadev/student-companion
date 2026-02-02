/**
 * Course Type Definitions
 */

import { School } from './school.types';

export interface Course {
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
  rating: number;
  ratingCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  school?: School; // Relacionamento incluído
}
