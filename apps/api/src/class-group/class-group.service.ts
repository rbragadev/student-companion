import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { UpdateClassGroupDto } from './dto/update-class-group.dto';

@Injectable()
export class ClassGroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureReferencesExist(unitId: string, periodId: string) {
    const [unit, period] = await Promise.all([
      this.prisma.unit.findUnique({ where: { id: unitId }, select: { id: true } }),
      this.prisma.academicPeriod.findUnique({ where: { id: periodId }, select: { id: true } }),
    ]);
    if (!unit) throw new NotFoundException(`Unidade ${unitId} não encontrada`);
    if (!period) throw new NotFoundException(`Período letivo ${periodId} não encontrado`);
  }

  async create(dto: CreateClassGroupDto) {
    await this.ensureReferencesExist(dto.unitId, dto.periodId);
    return this.prisma.classGroup.create({ data: dto });
  }

  findAll(unitId?: string, periodId?: string) {
    return this.prisma.classGroup.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        ...(periodId ? { periodId } : {}),
      },
      orderBy: [{ unit: { name: 'asc' } }, { name: 'asc' }],
      include: {
        unit: { select: { id: true, name: true, code: true } },
        period: { select: { id: true, name: true, status: true } },
      },
    });
  }

  async findOne(id: string) {
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            code: true,
            institution: { select: { id: true, name: true } },
          },
        },
        period: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
      },
    });

    if (!classGroup) throw new NotFoundException(`Turma ${id} não encontrada`);
    return classGroup;
  }

  async update(id: string, dto: UpdateClassGroupDto) {
    const current = await this.findOne(id);
    if (dto.unitId || dto.periodId) {
      await this.ensureReferencesExist(dto.unitId ?? current.unitId, dto.periodId ?? current.periodId);
    }
    return this.prisma.classGroup.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.classGroup.delete({ where: { id } });
  }
}
