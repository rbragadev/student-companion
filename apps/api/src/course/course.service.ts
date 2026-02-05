import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        id: randomUUID(),
        school_id: data.schoolId,
        program_name: data.programName,
        weekly_hours: data.weeklyHours,
        price_in_cents: data.priceInCents,
        price_unit: data.priceUnit,
        description: data.description,
        duration: data.duration,
        visa_type: data.visaType,
        target_audience: data.targetAudience,
        image: data.image,
        images: data.images || [],
        badges: data.badges || [],
        is_active: data.isActive ?? true,
      },
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
