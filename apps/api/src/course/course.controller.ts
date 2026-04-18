import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    const course = await this.courseService.createCourse(createCourseDto);
    return course;
  }

  @Get()
  async getAllCourses() {
    const courses = await this.courseService.getAllCourses();
    return courses;
  }

  @Get(':id/offers')
  async getCourseOffers(@Param('id') id: string) {
    return this.courseService.getCourseOffers(id);
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    const course = await this.courseService.getCourseById(id);
    return course;
  }

  @Patch(':id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, dto);
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: string) {
    return this.courseService.deleteCourse(id);
  }
}
