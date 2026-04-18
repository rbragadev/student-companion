import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ENROLLMENT_ACCOMMODATION_STATUSES } from '../enrollment.constants';

export class UpdateEnrollmentAccommodationWorkflowDto {
  @IsIn(ENROLLMENT_ACCOMMODATION_STATUSES)
  status!: (typeof ENROLLMENT_ACCOMMODATION_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;
}
