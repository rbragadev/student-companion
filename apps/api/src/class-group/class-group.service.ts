import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { UpdateClassGroupDto } from './dto/update-class-group.dto';

@Injectable()
export class ClassGroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) throw new NotFoundException(`Curso ${courseId} não encontrado`);
  }

  async create(dto: CreateClassGroupDto) {
    await this.ensureCourseExists(dto.courseId);
    return this.prisma.classGroup.create({ data: dto });
  }

  findAll(courseId?: string) {
    return this.prisma.classGroup.findMany({
      where: courseId ? { courseId } : undefined,
      orderBy: [{ course: { program_name: 'asc' } }, { name: 'asc' }],
      include: {
        course: {
          select: {
            id: true,
            program_name: true,
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
        },
        _count: { select: { periods: true } },
      },
    });
  }

  async findOne(id: string) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            program_name: true,
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
        },
        periods: {
          orderBy: { startDate: 'asc' },
          select: { id: true, name: true, startDate: true, endDate: true, status: true },
        },
      },
    });

    if (!classGroup) throw new NotFoundException(`Turma ${id} não encontrada`);
    return classGroup;
  }

  async update(id: string, dto: UpdateClassGroupDto) {
    await this.findOne(id);
    if (dto.courseId) {
      await this.ensureCourseExists(dto.courseId);
    }
    return this.prisma.classGroup.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.classGroup.delete({ where: { id } });
  }
}
