import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationPricingDto } from './dto/create-accommodation-pricing.dto';
import { UpdateAccommodationPricingDto } from './dto/update-accommodation-pricing.dto';

@Injectable()
export class AccommodationPricingService {
  constructor(private readonly prisma: PrismaService) {}

  private parseIsoDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private validateWeeklyRange(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isSundayToSunday = startDate.getUTCDay() === 0 && endDate.getUTCDay() === 0;
    if (diffDays <= 0 || diffDays % 7 !== 0 || !isSundayToSunday) {
      throw new BadRequestException(
        'Período semanal inválido: use intervalo múltiplo de 7 dias e datas de domingo a domingo',
      );
    }
    return diffDays / 7;
  }

  async create(dto: CreateAccommodationPricingDto) {
    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id: dto.accommodationId },
      select: { id: true },
    });
    if (!accommodation) {
      throw new NotFoundException(`Acomodação ${dto.accommodationId} não encontrada`);
    }

    return this.prisma.accommodationPricing.upsert({
      where: {
        accommodationId_periodOption: {
          accommodationId: dto.accommodationId,
          periodOption: dto.periodOption,
        },
      },
      create: {
        accommodationId: dto.accommodationId,
        periodOption: dto.periodOption,
        basePrice: dto.basePrice,
        currency: dto.currency ?? 'CAD',
        isActive: dto.isActive ?? true,
      },
      update: {
        basePrice: dto.basePrice,
        currency: dto.currency ?? 'CAD',
        isActive: dto.isActive ?? true,
      },
      include: {
        accommodation: { select: { id: true, title: true, accommodationType: true } },
      },
    });
  }

  findAll(filters?: { accommodationId?: string; periodOption?: string; isActive?: string }) {
    return this.prisma.accommodationPricing.findMany({
      where: {
        accommodationId: filters?.accommodationId,
        periodOption: filters?.periodOption,
        isActive:
          filters?.isActive === undefined
            ? undefined
            : filters.isActive === 'true'
              ? true
              : filters.isActive === 'false'
                ? false
                : undefined,
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        accommodation: { select: { id: true, title: true, accommodationType: true } },
      },
    });
  }

  async resolvePrice(
    accommodationId: string,
    periodOption?: string,
    options?: { startDate?: string; endDate?: string },
  ) {
    if (!accommodationId) {
      throw new BadRequestException('accommodationId é obrigatório');
    }
    const includeConfig = {
      accommodation: { select: { id: true, title: true, accommodationType: true } },
    } as const;

    let pricing = periodOption
      ? await this.prisma.accommodationPricing.findFirst({
          where: {
            accommodationId,
            periodOption,
            isActive: true,
          },
          include: includeConfig,
        })
      : null;

    if (!pricing) {
      pricing = await this.prisma.accommodationPricing.findFirst({
        where: {
          accommodationId,
          isActive: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        include: includeConfig,
      });
    }

    if (!pricing) {
      throw new NotFoundException(
        `Preço de acomodação não encontrado para accommodationId=${accommodationId}${
          periodOption ? ` e periodOption=${periodOption}` : ''
        }`,
      );
    }

    const startDate = this.parseIsoDate(options?.startDate);
    const endDate = this.parseIsoDate(options?.endDate);
    let weeks = 0;
    let calculatedAmount = Number(pricing.basePrice);

    if (startDate && endDate) {
      weeks = this.validateWeeklyRange(startDate, endDate);
      calculatedAmount = Number((Number(pricing.basePrice) * weeks).toFixed(2));
    }

    return {
      ...pricing,
      calculatedAmount,
      weeks,
      pricingLabel: 'per week',
    };
  }

  async update(id: string, dto: UpdateAccommodationPricingDto) {
    const current = await this.prisma.accommodationPricing.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Accommodation pricing ${id} não encontrado`);

    if (dto.accommodationId) {
      const accommodation = await this.prisma.accommodation.findUnique({
        where: { id: dto.accommodationId },
        select: { id: true },
      });
      if (!accommodation) {
        throw new NotFoundException(`Acomodação ${dto.accommodationId} não encontrada`);
      }
    }

    return this.prisma.accommodationPricing.update({
      where: { id },
      data: {
        accommodationId: dto.accommodationId,
        periodOption: dto.periodOption,
        basePrice: dto.basePrice,
        currency: dto.currency,
        isActive: dto.isActive,
      },
      include: {
        accommodation: { select: { id: true, title: true, accommodationType: true } },
      },
    });
  }
}
