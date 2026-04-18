import { IsOptional, IsUUID } from 'class-validator';

export class UpdateEnrollmentIntentDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  classGroupId?: string;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}
