import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureInstitutionExists(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException(`Instituição ${institutionId} não encontrada`);
  }

  async create(dto: CreateUnitDto) {
    await this.ensureInstitutionExists(dto.institutionId);
    return this.prisma.unit.create({ data: dto });
  }

  findAll(institutionId?: string) {
    return this.prisma.unit.findMany({
      where: institutionId ? { institutionId } : undefined,
      orderBy: [{ institution: { name: 'asc' } }, { name: 'asc' }],
      include: {
        institution: { select: { id: true, name: true } },
        _count: { select: { classes: true } },
      },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        institution: { select: { id: true, name: true } },
        classes: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true, status: true },
        },
      },
    });

    if (!unit) throw new NotFoundException(`Unidade ${id} não encontrada`);
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    if (dto.institutionId) {
      await this.ensureInstitutionExists(dto.institutionId);
    }
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unit.delete({ where: { id } });
  }
}
