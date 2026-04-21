import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationPricingDto } from './dto/create-accommodation-pricing.dto';
import { UpdateAccommodationPricingDto } from './dto/update-accommodation-pricing.dto';

@Injectable()
export class AccommodationPricingService {
  constructor(private readonly prisma: PrismaService) {}

  private parseIsoDate(value?: string): Date | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalizedDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const normalizedBrDate = /^\d{2}\/\d{2}\/\d{4}$/;
    const normalizedDdMmYyyy = /^\d{2}-\d{2}-\d{4}$/;

    const isoDate = normalizedDateOnly.test(trimmed) && !trimmed.includes('T') ? trimmed : null;
    const brDate = normalizedBrDate.test(trimmed)
      ? trimmed
      : normalizedDdMmYyyy.test(trimmed)
        ? `${trimmed.slice(6)}-${trimmed.slice(3, 5)}-${trimmed.slice(0, 2)}`
        : null;

    const date = isoDate
      ? this.parseIsoDateOnly(isoDate)
      : brDate
        ? this.parseIsoDateOnly(brDate)
        : new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseIsoDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  private toDateOnly(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  }

  private calculateStayDays(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const stayDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (stayDays <= 0) {
      throw new BadRequestException('A data de fim deve ser maior que a data de início.');
    }
    return stayDays;
  }

  private validateWeeklyRange(startDate: Date, endDate: Date) {
    const stayDays = this.calculateStayDays(startDate, endDate);
    const isSundayToSunday = startDate.getUTCDay() === 0 && endDate.getUTCDay() === 0;
    if (stayDays % 7 !== 0 || !isSundayToSunday) {
      throw new BadRequestException(
        'Período semanal inválido: use intervalo múltiplo de 7 dias e datas de domingo a domingo',
      );
    }
    return stayDays / 7;
  }

  private validateMinimumStay(stayDays: number, minimumStayDays: number, accommodationId: string) {
    if (minimumStayDays <= 0) {
      throw new BadRequestException('Mínimo de permanência inválido.');
    }
    if (stayDays < minimumStayDays) {
      throw new BadRequestException(
        `Esta acomodação exige permanência mínima de ${minimumStayDays} dias (${accommodationId}).`,
      );
    }
  }

  private validateWindow({
    startDate,
    endDate,
    windowStartDate,
    windowEndDate,
  }: {
    startDate: Date;
    endDate: Date;
    windowStartDate: Date | null;
    windowEndDate: Date | null;
  }) {
    const startDateOnly = this.toDateOnly(startDate);
    const endDateOnly = this.toDateOnly(endDate);
    const windowStartDateOnly = this.toDateOnly(windowStartDate);
    const windowEndDateOnly = this.toDateOnly(windowEndDate);

    if (windowStartDateOnly && startDateOnly < windowStartDateOnly) {
      throw new BadRequestException(
        `A data inicial está antes do início da janela da acomodação (${windowStartDateOnly}).`,
      );
    }
    if (windowEndDateOnly && endDateOnly > windowEndDateOnly) {
      throw new BadRequestException(
        `A data final está depois do fim da janela da acomodação (${windowEndDateOnly}).`,
      );
    }
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
        pricePerDay: dto.pricePerDay ?? 0,
        minimumStayDays: dto.minimumStayDays ?? 1,
        windowStartDate: dto.windowStartDate ? this.parseIsoDate(dto.windowStartDate) : null,
        windowEndDate: dto.windowEndDate ? this.parseIsoDate(dto.windowEndDate) : null,
        currency: dto.currency ?? 'CAD',
        isActive: dto.isActive ?? true,
      },
      update: {
        basePrice: dto.basePrice,
        pricePerDay: dto.pricePerDay ?? 0,
        minimumStayDays: dto.minimumStayDays ?? 1,
        windowStartDate: dto.windowStartDate ? this.parseIsoDate(dto.windowStartDate) : null,
        windowEndDate: dto.windowEndDate ? this.parseIsoDate(dto.windowEndDate) : null,
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

    const startDate = this.parseIsoDate(options?.startDate);
    const endDate = this.parseIsoDate(options?.endDate);

    const pricingCandidates = await this.prisma.accommodationPricing.findMany({
      where: {
        accommodationId,
        isActive: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      include: includeConfig,
    });

    const normalizedPeriod = periodOption?.trim().toLowerCase();
    const normalize = (value: string) => value.trim().toLowerCase();

    let pricing =
      normalizedPeriod
        ? pricingCandidates.find((item) => normalize(item.periodOption) === normalizedPeriod)
        : pricingCandidates[0];

    if (!pricing && normalizedPeriod) {
      pricing = pricingCandidates.find((item) => normalize(item.periodOption).includes(normalizedPeriod));
    }

    if (!pricing && startDate && endDate) {
      pricing = pricingCandidates.find((item) => {
        const itemWindowStart = item.windowStartDate ?? null;
        const itemWindowEnd = item.windowEndDate ?? null;
        if (itemWindowStart && startDate < itemWindowStart) return false;
        if (itemWindowEnd && endDate > itemWindowEnd) return false;
        return true;
      });
    }

    if (!pricing) {
      pricing = pricingCandidates[0];
    }

    if (!pricing) {
      throw new NotFoundException(
        `Preço de acomodação não encontrado para accommodationId=${accommodationId}${
          periodOption ? ` e periodOption=${periodOption}` : ''
        }`,
      );
    }

    const effectiveBasePrice = Number(pricing.basePrice);
    const effectivePricePerDay = Number(pricing.pricePerDay ?? 0);
    const minimumStayDays = pricing.minimumStayDays ?? 1;
    const effectiveCurrency = pricing.currency;
    const effectivePeriodOption = pricing.periodOption;
    const effectiveAccommodation = pricing.accommodation;
    const effectiveId = pricing.id;
    const effectiveWindowStartDate = pricing.windowStartDate ?? null;
    const effectiveWindowEndDate = pricing.windowEndDate ?? null;

    let weeks = 0;
    let durationDays = 0;
    let calculatedAmount = effectivePricePerDay > 0 ? effectiveBasePrice : effectiveBasePrice;

    let priceUnit = 'week';
    if (startDate && endDate) {
      if (effectiveWindowStartDate || effectiveWindowEndDate) {
        this.validateWindow({
          startDate,
          endDate,
          windowStartDate: effectiveWindowStartDate,
          windowEndDate: effectiveWindowEndDate,
        });
      }

      durationDays = this.calculateStayDays(startDate, endDate);
      this.validateMinimumStay(durationDays, minimumStayDays, effectiveAccommodation.title);
      if (effectivePricePerDay > 0) {
        calculatedAmount = Number((effectivePricePerDay * durationDays).toFixed(2));
        priceUnit = 'day';
      } else {
        weeks = this.validateWeeklyRange(startDate, endDate);
        durationDays = weeks * 7;
        calculatedAmount = Number((effectiveBasePrice * weeks).toFixed(2));
      }
    }

    return {
      id: effectiveId,
      accommodationId,
      periodOption: effectivePeriodOption,
      basePrice: effectivePricePerDay > 0 ? effectivePricePerDay : effectiveBasePrice,
      basePriceMode: effectivePricePerDay > 0 ? 'per_day' : 'weekly',
      currency: effectiveCurrency,
      minimumStayDays,
      windowStartDate: effectiveWindowStartDate?.toISOString() ?? null,
      windowEndDate: effectiveWindowEndDate?.toISOString() ?? null,
      isActive: pricing.isActive,
      accommodation: effectiveAccommodation,
      calculatedAmount,
      weeks,
      durationDays,
      selectedStartDate: startDate?.toISOString() ?? null,
      selectedEndDate: endDate?.toISOString() ?? null,
      breakdown: {
        basePrice: effectivePricePerDay > 0 ? effectivePricePerDay : effectiveBasePrice,
        priceUnit,
        weeks,
        durationDays,
        totalAmount: calculatedAmount,
      },
      pricingLabel: effectivePricePerDay > 0 ? 'per day' : 'per week',
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
        pricePerDay: dto.pricePerDay ?? current.pricePerDay,
        minimumStayDays: dto.minimumStayDays ?? current.minimumStayDays,
        windowStartDate: dto.windowStartDate ? this.parseIsoDate(dto.windowStartDate) : current.windowStartDate,
        windowEndDate: dto.windowEndDate ? this.parseIsoDate(dto.windowEndDate) : current.windowEndDate,
        currency: dto.currency,
        isActive: dto.isActive,
      },
      include: {
        accommodation: { select: { id: true, title: true, accommodationType: true } },
      },
    });
  }
}
