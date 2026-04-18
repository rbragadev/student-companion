import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEnrollmentIntentStatusDto {
  @IsIn(['pending', 'cancelled', 'denied'])
  status!: 'pending' | 'cancelled' | 'denied';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
