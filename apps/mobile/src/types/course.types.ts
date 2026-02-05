/**
 * Course Type Definitions
 */

import { School } from './school.types';

export interface Course {
  id: string;
  schoolId: string; // Frontend mantém camelCase
  programName: string;
  weeklyHours: number;
  priceInCents?: number;
  priceUnit?: string;
  description: string;
  duration: string;
  visaType: string;
  targetAudience: string;
  image: string;
  images: string[];
  badges: string[];
  rating?: number;
  ratingCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  school?: School; // Relacionamento incluído
}
