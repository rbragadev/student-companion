import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: { ...data, id: randomUUID() },
      include: {
        school: true,
      },
    });
  }

  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        school: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  async getCourseById(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });
  }
}
