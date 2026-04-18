import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  async createSchool(@Body() createSchoolDto: CreateSchoolDto) {
    const school = await this.schoolService.createSchool(createSchoolDto);
    return school;
  }

  @Get()
  async getAllSchools() {
    const schools = await this.schoolService.getAllSchools();
    return schools;
  }

  @Get(':id')
  async getSchoolById(@Param('id') id: string) {
    const school = await this.schoolService.getSchoolById(id);
    return school;
  }

  @Patch(':id')
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }

  @Delete(':id')
  async deleteSchool(@Param('id') id: string) {
    return this.schoolService.deleteSchool(id);
  }
}
