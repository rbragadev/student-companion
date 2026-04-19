import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ENROLLMENT_STATUSES } from '../enrollment.constants';

export class UpdateEnrollmentStatusDto {
  @IsIn(ENROLLMENT_STATUSES)
  status!: (typeof ENROLLMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;
}
