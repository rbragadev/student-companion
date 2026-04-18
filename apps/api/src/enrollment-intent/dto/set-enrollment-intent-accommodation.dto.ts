import { IsOptional, IsUUID } from 'class-validator';

export class SetEnrollmentIntentAccommodationDto {
  @IsOptional()
  @IsUUID()
  accommodationId?: string | null;
}
