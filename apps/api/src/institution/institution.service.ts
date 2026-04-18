import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInstitutionDto) {
    return this.prisma.institution.create({ data: dto });
  }

  findAll() {
    return this.prisma.institution.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { units: true } } },
    });
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!institution) throw new NotFoundException(`Instituição ${id} não encontrada`);
    return institution;
  }

  async update(id: string, dto: UpdateInstitutionDto) {
    await this.findOne(id);
    return this.prisma.institution.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.institution.delete({ where: { id } });
  }
}
