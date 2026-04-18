import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import { AccommodationService } from './accommodation.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';
import { UpsertSchoolAccommodationRecommendationDto } from './dto/upsert-school-accommodation-recommendation.dto';

@Controller('accommodation')
export class AccommodationController {
  constructor(
    private readonly accommodationService: AccommodationService,
  ) {}

  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationService.create(createAccommodationDto);
  }

  @Get()
  findAll() {
    return this.accommodationService.findAll();
  }

  @Get('recommended/school/:schoolId')
  findRecommendedBySchool(@Param('schoolId') schoolId: string) {
    return this.accommodationService.findRecommendedBySchool(schoolId);
  }

  @Get('upsell/enrollment/:enrollmentId')
  findUpsellByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.accommodationService.findUpsellByEnrollment(enrollmentId);
  }

  @Get('recommendations/school/:schoolId')
  findSchoolRecommendations(@Param('schoolId') schoolId: string) {
    return this.accommodationService.findSchoolRecommendations(schoolId);
  }

  @Patch('recommendations/school/:schoolId/:accommodationId')
  upsertSchoolRecommendation(
    @Param('schoolId') schoolId: string,
    @Param('accommodationId') accommodationId: string,
    @Body() dto: UpsertSchoolAccommodationRecommendationDto,
  ) {
    return this.accommodationService.upsertSchoolRecommendation(
      schoolId,
      accommodationId,
      dto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccommodationDto: UpdateAccommodationDto,
  ) {
    return this.accommodationService.update(id, updateAccommodationDto);
  }
}
