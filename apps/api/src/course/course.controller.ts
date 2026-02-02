import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';

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

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    const course = await this.courseService.getCourseById(id);
    return course;
  }
}
