/**
 * School Type Definitions
 */

export interface School {
  id: string;
  name: string;
  location: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isPartner: boolean;
  badges: string[];
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}
