import { IsOptional, IsUUID } from 'class-validator';

export class StartEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  courseId!: string;

  @IsUUID()
  classGroupId!: string;

  @IsUUID()
  academicPeriodId!: string;

  @IsOptional()
  @IsUUID()
  accommodationId?: string;
}

