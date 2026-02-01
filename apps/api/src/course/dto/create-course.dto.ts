import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUrl,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  programName: string;

  @IsInt()
  @Min(1)
  weeklyHours: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  priceInCents?: number; // Preço em centavos (ex: 145000 = $1,450.00 CAD)

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  duration: string; // Ex: "4-48 weeks (flexible)"

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  visaType: string; // Ex: "Study Permit or Visitor Visa"

  @IsString()
  @IsNotEmpty()
  targetAudience: string;

  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  image: string; // Imagem principal

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[]; // Array de URLs de imagens

  @IsString()
  @IsOptional()
  @MaxLength(100)
  badge?: string; // Ex: "Parceiro", "Popular"

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
