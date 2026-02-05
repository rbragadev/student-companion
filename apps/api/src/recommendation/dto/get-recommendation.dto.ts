import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";

export enum RecommendationType {
    ACCOMMODATION = 'accommodation',
    COURSE = 'course',
    PLACE = 'place',
    SCHOOL = 'school',
}

export class GetRecommendationsDto {
  @IsEnum(RecommendationType)
  type: RecommendationType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}