import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationPricingDto } from './dto/create-accommodation-pricing.dto';
import { UpdateAccommodationPricingDto } from './dto/update-accommodation-pricing.dto';

@Injectable()
export class AccommodationPricingService {
  constructor(private readonly prisma: PrismaService) {}

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

  async resolvePrice(accommodationId: string, periodOption?: string) {
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
    return pricing;
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
