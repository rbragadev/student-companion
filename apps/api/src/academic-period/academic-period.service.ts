import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@Injectable()
export class AcademicPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  private validateRange(startDate: Date, endDate: Date) {
    if (endDate <= startDate) {
      throw new BadRequestException('Data final deve ser maior que a data inicial');
    }
  }

  private async ensureClassGroupExists(classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      select: { id: true },
    });
    if (!classGroup) throw new NotFoundException(`Turma ${classGroupId} não encontrada`);
  }

  async create(dto: CreateAcademicPeriodDto) {
    await this.ensureClassGroupExists(dto.classGroupId);
    this.validateRange(dto.startDate, dto.endDate);
    return this.prisma.academicPeriod.create({ data: dto });
  }

  findAll(classGroupId?: string) {
    return this.prisma.academicPeriod.findMany({
      where: classGroupId ? { classGroupId } : undefined,
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
      include: {
        classGroup: {
          select: {
            id: true,
            name: true,
            code: true,
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
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        classGroup: {
          select: {
            id: true,
            name: true,
            code: true,
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
          },
        },
      },
    });

    if (!period) throw new NotFoundException(`Período letivo ${id} não encontrado`);
    return period;
  }

  async update(id: string, dto: UpdateAcademicPeriodDto) {
    const current = await this.findOne(id);

    if (dto.startDate && dto.endDate) {
      this.validateRange(dto.startDate, dto.endDate);
    } else if (dto.startDate || dto.endDate) {
      const current = await this.prisma.academicPeriod.findUnique({ where: { id } });
      if (!current) throw new NotFoundException(`Período letivo ${id} não encontrado`);
      this.validateRange(dto.startDate ?? current.startDate, dto.endDate ?? current.endDate);
    }

    if (dto.classGroupId) {
      await this.ensureClassGroupExists(dto.classGroupId);
    }

    return this.prisma.academicPeriod.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.academicPeriod.delete({ where: { id } });
  }
}
