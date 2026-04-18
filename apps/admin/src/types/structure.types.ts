export type RecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_TIME';

export interface Institution {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { units: number };
  units?: { id: string; name: string; code: string }[];
}

export interface Unit {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  institution?: { id: string; name: string };
  _count?: { classes: number };
  classes?: { id: string; name: string; code: string; status: RecordStatus }[];
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { classes: number };
  classes?: { id: string; name: string; code: string; status: RecordStatus; shift: Shift }[];
}

export interface ClassGroup {
  id: string;
  unitId: string;
  periodId: string;
  name: string;
  code: string;
  shift: Shift;
  status: RecordStatus;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    name: string;
    code: string;
    institution?: { id: string; name: string };
  };
  period?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    status: RecordStatus;
  };
}
