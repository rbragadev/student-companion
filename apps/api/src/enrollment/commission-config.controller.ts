import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommissionConfigService } from './commission-config.service';
import { CreateCommissionConfigDto } from './dto/create-commission-config.dto';
import { UpdateCommissionConfigDto } from './dto/update-commission-config.dto';

@Controller('commission-config')
export class CommissionConfigController {
  constructor(private readonly commissionConfigService: CommissionConfigService) {}

  @Get()
  findAll(
    @Query('scopeType') scopeType?: string,
    @Query('scopeId') scopeId?: string,
  ) {
    return this.commissionConfigService.findAll({ scopeType, scopeId });
  }

  @Post()
  create(@Body() dto: CreateCommissionConfigDto) {
    return this.commissionConfigService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommissionConfigDto) {
    return this.commissionConfigService.update(id, dto);
  }
}
