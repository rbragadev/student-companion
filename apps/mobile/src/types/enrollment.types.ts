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
}

export interface CreateEnrollmentIntentPayload {
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
}
