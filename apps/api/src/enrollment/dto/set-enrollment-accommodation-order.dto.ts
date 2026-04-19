import { IsOptional, IsUUID } from 'class-validator';

export class SetEnrollmentAccommodationOrderDto {
  @IsOptional()
  @IsUUID()
  orderId?: string | null;
}

