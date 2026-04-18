export interface ClassGroupOption {
  id: string;
  courseId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface AcademicPeriodOption {
  id: string;
  classGroupId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface EnrollmentIntent {
  id: string;
  status: 'pending' | 'converted' | 'cancelled' | 'denied';
  deniedReason?: string | null;
  convertedAt?: string | null;
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentStatus: string;
  };
  course?: {
    id: string;
    program_name: string;
  };
  classGroup?: {
    id: string;
    name: string;
    code: string;
  };
  academicPeriod?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface CreateEnrollmentIntentPayload {
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
}

export interface Enrollment {
  id: string;
  status: 'active' | 'completed' | 'cancelled' | 'denied';
  createdAt: string;
  institution: { id: string; name: string };
  school: { id: string; name: string };
  unit: { id: string; name: string; code: string };
  course: { id: string; program_name: string };
  classGroup: { id: string; name: string; code: string };
  academicPeriod: { id: string; name: string; startDate: string; endDate: string };
  enrollmentIntent?: { id: string; status: string; convertedAt?: string | null };
}

export interface StudentAcademicJourney {
  activeIntent: EnrollmentIntent | null;
  activeEnrollment: Enrollment | null;
  intentHistory: EnrollmentIntent[];
  enrollmentHistory: Enrollment[];
}
