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
  createdAt: string;
  updatedAt: string;
}
