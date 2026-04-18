import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccommodationPricingService } from './accommodation-pricing.service';
import { CreateAccommodationPricingDto } from './dto/create-accommodation-pricing.dto';
import { UpdateAccommodationPricingDto } from './dto/update-accommodation-pricing.dto';

@Controller('accommodation-pricing')
export class AccommodationPricingController {
  constructor(private readonly accommodationPricingService: AccommodationPricingService) {}

  @Post()
  create(@Body() dto: CreateAccommodationPricingDto) {
    return this.accommodationPricingService.create(dto);
  }

  @Get()
  findAll(
    @Query('accommodationId') accommodationId?: string,
    @Query('periodOption') periodOption?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.accommodationPricingService.findAll({ accommodationId, periodOption, isActive });
  }

  @Get('resolve')
  resolve(
    @Query('accommodationId') accommodationId: string,
    @Query('periodOption') periodOption?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accommodationPricingService.resolvePrice(accommodationId, periodOption, {
      startDate,
      endDate,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccommodationPricingDto) {
    return this.accommodationPricingService.update(id, dto);
  }
}
