import { Body, Controller, Get, Post } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';

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
  async getSchoolById(id: string) {
    const school = await this.schoolService.getSchoolById(id);
    return school;
  }
}
