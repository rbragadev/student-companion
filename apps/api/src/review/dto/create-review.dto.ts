import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ReviewableType } from '../enums/reviewable-type.enum';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ReviewableType)
  @IsNotEmpty()
  reviewableType: ReviewableType; // COURSE, ACCOMMODATION, PLACE

  @IsUUID()
  @IsNotEmpty()
  reviewableId: string; // ID da entidade sendo avaliada

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
