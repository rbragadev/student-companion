import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionConfigDto } from './dto/create-commission-config.dto';
import { UpdateCommissionConfigDto } from './dto/update-commission-config.dto';

@Injectable()
export class CommissionConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateScope(scopeType: string, scopeId: string) {
    if (scopeType === 'institution') {
      const institution = await this.prisma.institution.findUnique({
        where: { id: scopeId },
        select: { id: true },
      });
      if (!institution) throw new NotFoundException(`Instituição ${scopeId} não encontrada`);
      return;
    }

    if (scopeType === 'course') {
      const course = await this.prisma.course.findUnique({
        where: { id: scopeId },
        select: { id: true },
      });
      if (!course) throw new NotFoundException(`Curso ${scopeId} não encontrado`);
      return;
    }

    if (scopeType === 'accommodation') {
      const accommodation = await this.prisma.accommodation.findUnique({
        where: { id: scopeId },
        select: { id: true },
      });
      if (!accommodation) throw new NotFoundException(`Acomodação ${scopeId} não encontrada`);
    }
  }

  async create(dto: CreateCommissionConfigDto) {
    await this.validateScope(dto.scopeType, dto.scopeId);

    const existing = await this.prisma.commissionConfig.findFirst({
      where: { scopeType: dto.scopeType, scopeId: dto.scopeId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Já existe configuração de comissão para este escopo');
    }

    return this.prisma.commissionConfig.create({
      data: {
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount ?? null,
      },
    });
  }

  findAll(filters?: { scopeType?: string; scopeId?: string }) {
    return this.prisma.commissionConfig.findMany({
      where: {
        scopeType: filters?.scopeType,
        scopeId: filters?.scopeId,
      },
      orderBy: [{ scopeType: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async update(id: string, dto: UpdateCommissionConfigDto) {
    const current = await this.prisma.commissionConfig.findUnique({
      where: { id },
    });

    if (!current) throw new NotFoundException(`Configuração ${id} não encontrada`);

    const nextScopeType = dto.scopeType ?? current.scopeType;
    const nextScopeId = dto.scopeId ?? current.scopeId;

    await this.validateScope(nextScopeType, nextScopeId);

    if (nextScopeType !== current.scopeType || nextScopeId !== current.scopeId) {
      const conflict = await this.prisma.commissionConfig.findFirst({
        where: {
          scopeType: nextScopeType,
          scopeId: nextScopeId,
          id: { not: id },
        },
      });
      if (conflict) {
        throw new BadRequestException('Já existe configuração de comissão para este escopo');
      }
    }

    return this.prisma.commissionConfig.update({
      where: { id },
      data: {
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount,
      },
    });
  }

  async resolveForEnrollment(params: { institutionId: string; courseId: string }) {
    const [courseConfig, institutionConfig] = await Promise.all([
      this.prisma.commissionConfig.findFirst({
        where: { scopeType: 'course', scopeId: params.courseId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionConfig.findFirst({
        where: { scopeType: 'institution', scopeId: params.institutionId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return courseConfig ?? institutionConfig ?? null;
  }

  async resolveForAccommodation(accommodationId: string) {
    return this.prisma.commissionConfig.findFirst({
      where: { scopeType: 'accommodation', scopeId: accommodationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
