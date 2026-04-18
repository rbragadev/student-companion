export type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_TIME';

export interface Institution {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { schools: number };
  schools?: { id: string; name: string; location: string; units?: { id: string; name: string; code: string }[] }[];
}

export interface Unit {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string; institution?: { id: string; name: string } };
  _count?: { courses: number };
  courses?: { id: string; program_name: string; is_active: boolean }[];
}

export interface AcademicPeriod {
  id: string;
  classGroupId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  classGroup?: {
    id: string;
    name: string;
    code: string;
    course?: {
      id: string;
      program_name: string;
      unit?: {
        id: string;
        name: string;
        code: string;
        school?: { id: string; name: string; institution?: { id: string; name: string } };
      };
    };
  };
}

export interface ClassGroup {
  id: string;
  courseId: string;
  name: string;
  code: string;
  shift: Shift;
  status: RecordStatus;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    program_name: string;
    unit?: {
      id: string;
      name: string;
      code: string;
      school?: { id: string; name: string; institution?: { id: string; name: string } };
    };
  };
  periods?: { id: string; name: string; startDate: string; endDate: string; status: RecordStatus }[];
  _count?: { periods: number };
}
