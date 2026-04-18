import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type EnrollmentQuote } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionConfigService } from './commission-config.service';
import { CreateEnrollmentQuoteDto } from './dto/create-enrollment-quote.dto';
import { ENROLLMENT_QUOTE_TYPES, type EnrollmentQuoteType } from './enrollment.constants';

@Injectable()
export class EnrollmentQuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionConfigService: CommissionConfigService,
  ) {}

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private resolveQuoteType(courseAmount: number, accommodationAmount: number): EnrollmentQuoteType {
    if (courseAmount > 0 && accommodationAmount > 0) return 'course_with_accommodation';
    if (courseAmount > 0 && accommodationAmount <= 0) return 'course_only';
    if (courseAmount <= 0 && accommodationAmount > 0) return 'accommodation_only';
    throw new BadRequestException('Quote inválida: curso e acomodação zerados');
  }

  async create(dto: CreateEnrollmentQuoteDto) {
    const resolvedIntent = dto.enrollmentIntentId
      ? await this.prisma.enrollmentIntent.findUnique({
          where: { id: dto.enrollmentIntentId },
          include: {
            course: { select: { id: true, school: { select: { institutionId: true } } } },
            academicPeriod: { select: { id: true, name: true } },
            accommodation: { select: { id: true } },
          },
        })
      : null;

    if (dto.enrollmentIntentId && !resolvedIntent) {
      throw new NotFoundException(`Intenção ${dto.enrollmentIntentId} não encontrada`);
    }

    const courseId = dto.courseId ?? resolvedIntent?.courseId;
    const academicPeriodId = dto.academicPeriodId ?? resolvedIntent?.academicPeriodId;
    const accommodationId = dto.accommodationId ?? resolvedIntent?.accommodationId ?? undefined;
    const defaultPeriodOption = dto.periodOption ?? resolvedIntent?.academicPeriod.name ?? undefined;

    let coursePricing = dto.coursePricingId
      ? await this.prisma.coursePricing.findUnique({
          where: { id: dto.coursePricingId },
          include: {
            course: { select: { id: true, school: { select: { institutionId: true } } } },
            academicPeriod: { select: { id: true, name: true } },
          },
        })
      : null;

    if (dto.coursePricingId && !coursePricing) {
      throw new NotFoundException(`Course pricing ${dto.coursePricingId} não encontrado`);
    }

    if (!coursePricing && courseId && academicPeriodId) {
      coursePricing = await this.prisma.coursePricing.findFirst({
        where: { courseId, academicPeriodId, isActive: true },
        include: {
          course: { select: { id: true, school: { select: { institutionId: true } } } },
          academicPeriod: { select: { id: true, name: true } },
        },
      });
    }

    let accommodationPricing = dto.accommodationPricingId
      ? await this.prisma.accommodationPricing.findUnique({
          where: { id: dto.accommodationPricingId },
          include: {
            accommodation: { select: { id: true } },
          },
        })
      : null;

    if (dto.accommodationPricingId && !accommodationPricing) {
      throw new NotFoundException(
        `Accommodation pricing ${dto.accommodationPricingId} não encontrado`,
      );
    }

    if (!accommodationPricing && accommodationId) {
      accommodationPricing = await this.prisma.accommodationPricing.findFirst({
        where: {
          accommodationId,
          periodOption: defaultPeriodOption,
          isActive: true,
        },
        include: {
          accommodation: { select: { id: true } },
        },
      });
      if (!accommodationPricing) {
        accommodationPricing = await this.prisma.accommodationPricing.findFirst({
          where: {
            accommodationId,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            accommodation: { select: { id: true } },
          },
        });
      }
    }

    if (!coursePricing && !accommodationPricing) {
      throw new BadRequestException(
        'Não foi possível montar quote: informe coursePricingId/accommodationPricingId ou contexto com preços válidos',
      );
    }

    if (coursePricing && courseId && coursePricing.course.id !== courseId) {
      throw new BadRequestException('coursePricingId não pertence ao curso informado');
    }

    if (coursePricing && academicPeriodId && coursePricing.academicPeriod.id !== academicPeriodId) {
      throw new BadRequestException('coursePricingId não pertence ao período informado');
    }

    if (
      coursePricing &&
      resolvedIntent &&
      (coursePricing.course.id !== resolvedIntent.courseId ||
        coursePricing.academicPeriod.id !== resolvedIntent.academicPeriodId)
    ) {
      throw new BadRequestException(
        'coursePricingId não é compatível com o curso/período da intenção informada',
      );
    }

    if (
      accommodationPricing &&
      accommodationId &&
      accommodationPricing.accommodation.id !== accommodationId
    ) {
      throw new BadRequestException('accommodationPricingId não pertence à acomodação informada');
    }

    const courseAmount = this.toNumber(coursePricing?.basePrice);
    const accommodationAmount = this.toNumber(accommodationPricing?.basePrice);
    const fees = dto.fees ?? 0;
    const discounts = dto.discounts ?? 0;
    const totalAmount = Math.max(0, courseAmount + accommodationAmount + fees - discounts);
    const downPaymentPercentage = dto.downPaymentPercentage ?? 30;
    const downPaymentAmount = Number((totalAmount * (downPaymentPercentage / 100)).toFixed(2));
    const remainingAmount = Number((totalAmount - downPaymentAmount).toFixed(2));
    const type = this.resolveQuoteType(courseAmount, accommodationAmount);

    if (!ENROLLMENT_QUOTE_TYPES.includes(type)) {
      throw new BadRequestException('Tipo de quote inválido');
    }

    const courseCommissionConfig = coursePricing
      ? await this.commissionConfigService.resolveForEnrollment({
          institutionId: coursePricing.course.school.institutionId,
          courseId: coursePricing.course.id,
        })
      : null;
    const accommodationCommissionConfig = accommodationPricing
      ? await this.commissionConfigService.resolveForAccommodation(
          accommodationPricing.accommodation.id,
        )
      : null;

    const courseCommissionPercentage = this.toNumber(courseCommissionConfig?.percentage);
    const courseCommissionFixed = this.toNumber(courseCommissionConfig?.fixedAmount ?? 0);
    const commissionCourseAmount = Number(
      (courseAmount * (courseCommissionPercentage / 100) + courseCommissionFixed).toFixed(2),
    );

    const accommodationCommissionPercentage = this.toNumber(accommodationCommissionConfig?.percentage);
    const accommodationCommissionFixed = this.toNumber(accommodationCommissionConfig?.fixedAmount ?? 0);
    const commissionAccommodationAmount = Number(
      (
        accommodationAmount * (accommodationCommissionPercentage / 100) +
        accommodationCommissionFixed
      ).toFixed(2),
    );

    const commissionAmount = Number((commissionCourseAmount + commissionAccommodationAmount).toFixed(2));
    const commissionPercentage = totalAmount
      ? Number(((commissionAmount / totalAmount) * 100).toFixed(4))
      : 0;

    return this.prisma.enrollmentQuote.create({
      data: {
        enrollmentIntentId: resolvedIntent?.id ?? dto.enrollmentIntentId ?? null,
        coursePricingId: coursePricing?.id ?? null,
        accommodationPricingId: accommodationPricing?.id ?? null,
        courseAmount,
        accommodationAmount,
        fees,
        discounts,
        totalAmount,
        currency: coursePricing?.currency ?? accommodationPricing?.currency ?? 'CAD',
        downPaymentPercentage,
        downPaymentAmount,
        remainingAmount,
        commissionPercentage,
        commissionAmount,
        commissionCourseAmount,
        commissionAccommodationAmount,
        type,
      },
      include: {
        coursePricing: {
          include: {
            course: { select: { id: true, program_name: true } },
            academicPeriod: { select: { id: true, name: true } },
          },
        },
        accommodationPricing: {
          include: {
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.enrollmentQuote.findUnique({
      where: { id },
      include: {
        enrollmentIntent: { select: { id: true, status: true, studentId: true } },
        coursePricing: {
          include: {
            course: { select: { id: true, program_name: true } },
            academicPeriod: { select: { id: true, name: true } },
          },
        },
        accommodationPricing: {
          include: {
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });
  }

  async findByIntent(intentId: string) {
    const quote = await this.prisma.enrollmentQuote.findFirst({
      where: { enrollmentIntentId: intentId },
      orderBy: { createdAt: 'desc' },
      include: {
        coursePricing: {
          include: {
            course: { select: { id: true, program_name: true } },
            academicPeriod: { select: { id: true, name: true } },
          },
        },
        accommodationPricing: {
          include: {
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });
    if (!quote) {
      throw new NotFoundException(`Quote para intent ${intentId} não encontrada`);
    }
    return quote;
  }

  async findLatestByIntent(intentId: string): Promise<EnrollmentQuote | null> {
    return this.prisma.enrollmentQuote.findFirst({
      where: { enrollmentIntentId: intentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
