import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AcademicPeriodService } from './academic-period.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@Controller('academic-period')
export class AcademicPeriodController {
  constructor(private readonly academicPeriodService: AcademicPeriodService) {}

  @Post()
  create(@Body() dto: CreateAcademicPeriodDto) {
    return this.academicPeriodService.create(dto);
  }

  @Get()
  findAll() {
    return this.academicPeriodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicPeriodService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.academicPeriodService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.academicPeriodService.remove(id);
  }
}
