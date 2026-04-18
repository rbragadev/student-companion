import { IsIn } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsIn(['active', 'completed', 'cancelled', 'denied'])
  status!: 'active' | 'completed' | 'cancelled' | 'denied';
}
