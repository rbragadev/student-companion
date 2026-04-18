import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureReferencesExist(unitId: string, schoolId: string) {
    const [unit, school] = await Promise.all([
      this.prisma.unit.findUnique({ where: { id: unitId }, select: { id: true, schoolId: true } }),
      this.prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } }),
    ]);

    if (!unit) throw new NotFoundException(`Unidade ${unitId} não encontrada`);
    if (!school) throw new NotFoundException(`Escola ${schoolId} não encontrada`);
    if (unit.schoolId !== schoolId) {
      throw new BadRequestException('A unidade selecionada não pertence à escola informada');
    }
  }

  async createCourse(data: CreateCourseDto) {
    await this.ensureReferencesExist(data.unitId, data.schoolId);

    return this.prisma.course.create({
      data: {
        id: randomUUID(),
        unitId: data.unitId,
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
        school: { select: { id: true, name: true, location: true } },
        unit: {
          select: {
            id: true,
            name: true,
            code: true,
            school: {
              select: {
                id: true,
                name: true,
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        school: { select: { id: true, name: true, location: true } },
        unit: {
          select: {
            id: true,
            name: true,
            code: true,
            school: {
              select: {
                id: true,
                name: true,
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, location: true } },
        unit: {
          select: {
            id: true,
            name: true,
            code: true,
            school: {
              select: {
                id: true,
                name: true,
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
        classes: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true, status: true },
        },
      },
    });
    if (!course) throw new NotFoundException(`Curso ${id} não encontrado`);
    return course;
  }

  async updateCourse(id: string, data: UpdateCourseDto) {
    const current = await this.getCourseById(id);

    const unitId = data.unitId ?? current.unitId;
    const schoolId = data.schoolId ?? current.school_id;
    if (data.unitId || data.schoolId) {
      await this.ensureReferencesExist(unitId, schoolId);
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        unitId: data.unitId,
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
        images: data.images,
        badges: data.badges,
        is_active: data.isActive,
      },
      include: {
        school: { select: { id: true, name: true, location: true } },
        unit: {
          select: {
            id: true,
            name: true,
            code: true,
            school: {
              select: {
                id: true,
                name: true,
                institution: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async deleteCourse(id: string) {
    await this.getCourseById(id);
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
