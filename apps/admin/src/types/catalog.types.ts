export interface SchoolAdmin {
  id: string;
  institutionId: string;
  name: string;
  location: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  isPartner: boolean;
  institution?: { id: string; name: string };
  _count?: { course: number };
}

export interface CourseAdmin {
  id: string;
  unitId: string;
  school_id: string;
  program_name: string;
  weekly_hours: number;
  price_in_cents: number | null;
  price_unit: string | null;
  description: string;
  duration: string;
  visa_type: string;
  target_audience: string;
  image: string;
  images: string[];
  badges: string[];
  is_active: boolean;
  classes?: { id: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }[];
  school?: { id: string; name: string; location: string; institution?: { id: string; name: string } };
  unit?: {
    id: string;
    name: string;
    code: string;
    school?: { id: string; name: string; institution?: { id: string; name: string } };
  };
}

export interface AccommodationAdmin {
  id: string;
  title: string;
  accommodationType: string;
  location: string;
  priceInCents: number;
  priceUnit: string;
  isActive: boolean;
}

export interface PlaceAdmin {
  id: string;
  name: string;
  category: string;
  location: string | null;
  rating: number | null;
  isActive: boolean | null;
}

export interface StudentAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT';
  preferences?: {
    destinationCity: string;
    destinationCountry: string;
    purpose: string;
    englishLevel: string | null;
  } | null;
}
