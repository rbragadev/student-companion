import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSchoolExists(schoolId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException(`Escola ${schoolId} não encontrada`);
  }

  async create(dto: CreateUnitDto) {
    await this.ensureSchoolExists(dto.schoolId);
    return this.prisma.unit.create({ data: dto });
  }

  findAll(schoolId?: string) {
    return this.prisma.unit.findMany({
      where: schoolId ? { schoolId } : undefined,
      orderBy: [{ school: { name: 'asc' } }, { name: 'asc' }],
      include: {
        school: {
          select: {
            id: true,
            name: true,
            institution: { select: { id: true, name: true } },
          },
        },
        _count: { select: { courses: true } },
      },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            institution: { select: { id: true, name: true } },
          },
        },
        courses: {
          orderBy: { program_name: 'asc' },
          select: { id: true, program_name: true, is_active: true },
        },
      },
    });

    if (!unit) throw new NotFoundException(`Unidade ${id} não encontrada`);
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    if (dto.schoolId) {
      await this.ensureSchoolExists(dto.schoolId);
    }
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unit.delete({ where: { id } });
  }
}
