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
  periodType?: 'weekly' | 'fixed';
  autoApproveIntent?: boolean;
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

export interface CourseOffer {
  id: string;
  courseId: string;
  classGroupId: string;
  classGroupName: string;
  classGroupCode: string;
  academicPeriodId: string;
  academicPeriodName: string;
  startDate: string;
  endDate: string;
  coursePricingId: string;
  basePrice: number;
  currency: string;
  duration?: string | null;
  isActive: boolean;
}
