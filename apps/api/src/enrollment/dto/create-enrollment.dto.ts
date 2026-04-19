import { IsOptional, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  classGroupId: string;

  @IsUUID()
  academicPeriodId: string;

  @IsOptional()
  @IsUUID()
  accommodationId?: string;
}
