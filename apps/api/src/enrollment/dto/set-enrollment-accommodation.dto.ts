import { IsOptional, IsUUID } from 'class-validator';

export class SetEnrollmentAccommodationDto {
  @IsOptional()
  @IsUUID()
  accommodationId?: string | null;
}
