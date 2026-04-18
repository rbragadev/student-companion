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

  create(dto: CreateAcademicPeriodDto) {
    this.validateRange(dto.startDate, dto.endDate);
    return this.prisma.academicPeriod.create({ data: dto });
  }

  findAll() {
    return this.prisma.academicPeriod.findMany({
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { classes: true } } },
    });
  }

  async findOne(id: string) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        classes: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true, status: true, shift: true },
        },
      },
    });

    if (!period) throw new NotFoundException(`Período letivo ${id} não encontrado`);
    return period;
  }

  async update(id: string, dto: UpdateAcademicPeriodDto) {
    await this.findOne(id);

    if (dto.startDate && dto.endDate) {
      this.validateRange(dto.startDate, dto.endDate);
    } else if (dto.startDate || dto.endDate) {
      const current = await this.prisma.academicPeriod.findUnique({ where: { id } });
      if (!current) throw new NotFoundException(`Período letivo ${id} não encontrado`);
      this.validateRange(dto.startDate ?? current.startDate, dto.endDate ?? current.endDate);
    }

    return this.prisma.academicPeriod.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.academicPeriod.delete({ where: { id } });
  }
}
