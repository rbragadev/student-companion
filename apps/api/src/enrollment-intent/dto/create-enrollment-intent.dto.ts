import { IsUUID } from 'class-validator';

export class CreateEnrollmentIntentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  classGroupId: string;

  @IsUUID()
  academicPeriodId: string;
}
