import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type EnrollmentQuote } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionConfigService } from './commission-config.service';
import {
  CreateEnrollmentQuoteDto,
  CreateEnrollmentQuoteItemDto,
} from './dto/create-enrollment-quote.dto';
import { UpdateEnrollmentQuoteDto } from './dto/update-enrollment-quote.dto';
import { ENROLLMENT_QUOTE_TYPES, type EnrollmentQuoteType } from './enrollment.constants';

type PackageStatus =
  | 'draft'
  | 'proposal_sent'
  | 'awaiting_approval'
  | 'approved'
  | 'checkout_available'
  | 'payment_pending'
  | 'paid'
  | 'cancelled';

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

  private validateDateRange(startDate: Date, endDate: Date, label: string) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException(`Datas inválidas para item ${label}`);
    }
    if (endDate <= startDate) {
      throw new BadRequestException(`endDate deve ser maior que startDate para item ${label}`);
    }
  }

  private validateWeeklyRange(startDate: Date, endDate: Date, label: string) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isSundayToSunday = startDate.getUTCDay() === 0 && endDate.getUTCDay() === 0;
    if (diffDays <= 0 || diffDays % 7 !== 0 || !isSundayToSunday) {
      throw new BadRequestException(
        `Período semanal inválido para item ${label}: use intervalo múltiplo de 7 dias e datas de domingo a domingo`,
      );
    }
  }

  private weeksBetween(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays / 7;
  }

  private async syncEnrollmentPricingFromQuote(
    enrollmentId: string,
    quote: Pick<
      EnrollmentQuote,
      | 'courseAmount'
      | 'accommodationAmount'
      | 'fees'
      | 'discounts'
      | 'totalAmount'
      | 'currency'
      | 'commissionAmount'
      | 'commissionPercentage'
      | 'commissionCourseAmount'
      | 'commissionAccommodationAmount'
    >,
  ) {
    await this.prisma.enrollmentPricing.upsert({
      where: { enrollmentId },
      create: {
        enrollmentId,
        basePrice: this.toNumber(quote.courseAmount),
        fees: this.toNumber(quote.fees),
        discounts: this.toNumber(quote.discounts),
        totalAmount: this.toNumber(quote.totalAmount),
        enrollmentAmount: this.toNumber(quote.courseAmount),
        accommodationAmount: this.toNumber(quote.accommodationAmount),
        packageTotalAmount: this.toNumber(quote.totalAmount),
        currency: quote.currency,
        commissionAmount: this.toNumber(quote.commissionAmount),
        commissionPercentage: this.toNumber(quote.commissionPercentage),
        enrollmentCommissionAmount: this.toNumber(quote.commissionCourseAmount),
        enrollmentCommissionPercentage: this.toNumber(quote.commissionPercentage),
        accommodationCommissionAmount: this.toNumber(quote.commissionAccommodationAmount),
        accommodationCommissionPercentage: 0,
        totalCommissionAmount: this.toNumber(quote.commissionAmount),
      },
      update: {
        basePrice: this.toNumber(quote.courseAmount),
        fees: this.toNumber(quote.fees),
        discounts: this.toNumber(quote.discounts),
        totalAmount: this.toNumber(quote.totalAmount),
        enrollmentAmount: this.toNumber(quote.courseAmount),
        accommodationAmount: this.toNumber(quote.accommodationAmount),
        packageTotalAmount: this.toNumber(quote.totalAmount),
        currency: quote.currency,
        commissionAmount: this.toNumber(quote.commissionAmount),
        commissionPercentage: this.toNumber(quote.commissionPercentage),
        enrollmentCommissionAmount: this.toNumber(quote.commissionCourseAmount),
        enrollmentCommissionPercentage: this.toNumber(quote.commissionPercentage),
        accommodationCommissionAmount: this.toNumber(quote.commissionAccommodationAmount),
        totalCommissionAmount: this.toNumber(quote.commissionAmount),
      },
    });
  }

  private resolvePackageStatusContext(input: {
    intentStatus?: string | null;
    enrollmentStatus?: string | null;
    autoApproveIntent?: boolean;
    hasPendingPayment?: boolean;
    hasPaidDownPayment?: boolean;
  }): { packageStatus: PackageStatus; nextStep: string } {
    const {
      intentStatus,
      enrollmentStatus,
      autoApproveIntent,
      hasPendingPayment,
      hasPaidDownPayment,
    } = input;

    if (hasPaidDownPayment) {
      return {
        packageStatus: 'paid',
        nextStep: 'Pagamento confirmado. Seguir com etapas operacionais.',
      };
    }

    if (['cancelled', 'denied', 'rejected'].includes(enrollmentStatus ?? intentStatus ?? '')) {
      return {
        packageStatus: 'cancelled',
        nextStep: 'Pacote cancelado/negado. Ajuste itens e reenvie se necessário.',
      };
    }

    if (enrollmentStatus) {
      const approvalReady =
        autoApproveIntent === true || ['approved', 'enrolled', 'completed'].includes(enrollmentStatus);
      if (!approvalReady) {
        return {
          packageStatus: 'awaiting_approval',
          nextStep: 'Aguardando aprovação operacional para liberar checkout.',
        };
      }

      if (hasPendingPayment) {
        return {
          packageStatus: 'payment_pending',
          nextStep: 'Checkout liberado. Falta concluir pagamento.',
        };
      }

      return {
        packageStatus: 'checkout_available',
        nextStep: 'Checkout disponível para pagamento da entrada.',
      };
    }

    if (intentStatus === 'pending') {
      return {
        packageStatus: 'proposal_sent',
        nextStep: 'Proposta enviada. Aguarde análise da operação.',
      };
    }

    if (intentStatus === 'converted') {
      return {
        packageStatus: 'approved',
        nextStep: 'Proposta convertida em matrícula. Checkout disponível na jornada.',
      };
    }

    return {
      packageStatus: 'draft',
      nextStep: 'Pacote em rascunho. Revise itens e datas antes de fechar.',
    };
  }

  private async enrichQuote<T extends { id: string; enrollmentIntentId?: string | null }>(quote: T) {
    const [intent, enrollment, payments] = await Promise.all([
      quote.enrollmentIntentId
        ? this.prisma.enrollmentIntent.findUnique({
            where: { id: quote.enrollmentIntentId },
            select: {
              id: true,
              status: true,
              studentId: true,
              student: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          })
        : Promise.resolve(null),
      quote.enrollmentIntentId
        ? this.prisma.enrollment.findFirst({
            where: { enrollmentIntentId: quote.enrollmentIntentId },
            select: {
              id: true,
              status: true,
              course: {
                select: {
                  auto_approve_intent: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      this.prisma.payment.findMany({
        where: { enrollmentQuoteId: quote.id },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const hasPaidDownPayment = payments.some(
      (item) => item.type === 'down_payment' && item.status === 'paid',
    );
    const hasPendingPayment = payments.some((item) => item.status === 'pending');

    const statusContext = this.resolvePackageStatusContext({
      intentStatus: intent?.status,
      enrollmentStatus: enrollment?.status,
      autoApproveIntent: enrollment?.course.auto_approve_intent ?? undefined,
      hasPendingPayment,
      hasPaidDownPayment,
    });

    return {
      ...quote,
      enrollmentIntent: intent,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
          }
        : null,
      packageStatus: statusContext.packageStatus,
      nextStep: statusContext.nextStep,
      payments,
    };
  }

  async create(dto: CreateEnrollmentQuoteDto) {
    const resolvedIntent = dto.enrollmentIntentId
      ? await this.prisma.enrollmentIntent.findUnique({
          where: { id: dto.enrollmentIntentId },
          include: {
            course: { select: { id: true, school: { select: { institutionId: true } } } },
            academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
            accommodation: { select: { id: true } },
            enrollment: { select: { id: true } },
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
            course: {
              select: {
                id: true,
                period_type: true,
                school: { select: { institutionId: true } },
              },
            },
            academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
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
          course: {
            select: {
              id: true,
              period_type: true,
              school: { select: { institutionId: true } },
            },
          },
          academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
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

    type ResolvedQuoteItem = {
      itemType: 'course' | 'accommodation';
      startDate: Date;
      endDate: Date;
      amount: number;
      commissionAmount: number;
      referenceId: string;
      coursePricingId?: string;
      accommodationPricingId?: string;
      currency: string;
    };

    const normalizedItems: CreateEnrollmentQuoteItemDto[] = dto.items?.length
      ? dto.items
      : [
          ...(coursePricing || dto.coursePricingId || (courseId && academicPeriodId)
            ? [
                {
                  itemType: 'course' as const,
                  referenceId: coursePricing?.id ?? dto.coursePricingId,
                  coursePricingId: coursePricing?.id ?? dto.coursePricingId,
                  startDate:
                    dto.startDate ??
                    resolvedIntent?.academicPeriod.startDate.toISOString() ??
                    new Date().toISOString(),
                  endDate:
                    dto.endDate ??
                    resolvedIntent?.academicPeriod.endDate.toISOString() ??
                    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
                },
              ]
            : []),
          ...(accommodationPricing || dto.accommodationPricingId || accommodationId
            ? [
                {
                  itemType: 'accommodation' as const,
                  referenceId: accommodationPricing?.id ?? dto.accommodationPricingId,
                  accommodationPricingId: accommodationPricing?.id ?? dto.accommodationPricingId,
                  startDate:
                    dto.startDate ??
                    resolvedIntent?.academicPeriod.startDate.toISOString() ??
                    new Date().toISOString(),
                  endDate:
                    dto.endDate ??
                    resolvedIntent?.academicPeriod.endDate.toISOString() ??
                    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
                },
              ]
            : []),
        ];

    if (!normalizedItems.length) {
      throw new BadRequestException(
        'Não foi possível montar quote: informe items ou contexto com preços válidos',
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

    const resolvedItems: ResolvedQuoteItem[] = [];
    const contextInstitutionId =
      resolvedIntent?.course.school.institutionId ?? coursePricing?.course.school.institutionId ?? null;

    for (const [index, rawItem] of normalizedItems.entries()) {
      const startDate = new Date(rawItem.startDate);
      const endDate = new Date(rawItem.endDate);
      const itemLabel = `${rawItem.itemType}#${index + 1}`;
      this.validateDateRange(startDate, endDate, itemLabel);

      if (rawItem.itemType === 'course') {
        const resolvedCoursePricing =
          coursePricing && (rawItem.referenceId === coursePricing.id || rawItem.coursePricingId === coursePricing.id)
            ? coursePricing
            : await this.prisma.coursePricing.findUnique({
                where: { id: rawItem.referenceId ?? rawItem.coursePricingId ?? '' },
                include: {
                  course: { select: { id: true, period_type: true, school: { select: { institutionId: true } } } },
                  academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
                },
              });

        if (!resolvedCoursePricing) {
          throw new NotFoundException(`Preço de curso não encontrado para item ${itemLabel}`);
        }

        if (resolvedCoursePricing.course.period_type === 'weekly') {
          this.validateWeeklyRange(startDate, endDate, itemLabel);
        } else {
          if (
            startDate < resolvedCoursePricing.academicPeriod.startDate ||
            endDate > resolvedCoursePricing.academicPeriod.endDate
          ) {
            throw new BadRequestException(
              `Período fixo inválido para item ${itemLabel}: datas fora da janela do período acadêmico`,
            );
          }
        }

        const cfg = await this.commissionConfigService.resolveForEnrollment({
          institutionId: resolvedCoursePricing.course.school.institutionId,
          courseId: resolvedCoursePricing.course.id,
        });
        const pct = this.toNumber(cfg?.percentage);
        const fixed = this.toNumber(cfg?.fixedAmount ?? 0);
        const amount =
          resolvedCoursePricing.course.period_type === 'weekly'
            ? Number(
                (
                  this.toNumber(resolvedCoursePricing.basePrice) *
                  this.weeksBetween(startDate, endDate)
                ).toFixed(2),
              )
            : this.toNumber(resolvedCoursePricing.basePrice);
        const commissionAmount = Number((amount * (pct / 100) + fixed).toFixed(2));

        resolvedItems.push({
          itemType: 'course',
          startDate,
          endDate,
          amount,
          commissionAmount,
          referenceId: resolvedCoursePricing.id,
          coursePricingId: resolvedCoursePricing.id,
          currency: resolvedCoursePricing.currency,
        });
        continue;
      }

      const resolvedAccommodationPricing =
        accommodationPricing &&
        (rawItem.referenceId === accommodationPricing.id ||
          rawItem.accommodationPricingId === accommodationPricing.id)
          ? accommodationPricing
          : await this.prisma.accommodationPricing.findUnique({
              where: { id: rawItem.referenceId ?? rawItem.accommodationPricingId ?? '' },
              include: {
                accommodation: { select: { id: true } },
              },
            });
      if (!resolvedAccommodationPricing) {
        throw new NotFoundException(`Preço de acomodação não encontrado para item ${itemLabel}`);
      }

      this.validateWeeklyRange(startDate, endDate, itemLabel);

      const cfg = await this.commissionConfigService.resolveForAccommodation({
        accommodationId: resolvedAccommodationPricing.accommodation.id,
        institutionId: contextInstitutionId,
      });
      const pct = this.toNumber(cfg?.percentage);
      const fixed = this.toNumber(cfg?.fixedAmount ?? 0);
      const amount = Number(
        (
          this.toNumber(resolvedAccommodationPricing.basePrice) *
          this.weeksBetween(startDate, endDate)
        ).toFixed(2),
      );
      const commissionAmount = Number((amount * (pct / 100) + fixed).toFixed(2));

      resolvedItems.push({
        itemType: 'accommodation',
        startDate,
        endDate,
        amount,
        commissionAmount,
        referenceId: resolvedAccommodationPricing.id,
        accommodationPricingId: resolvedAccommodationPricing.id,
        currency: resolvedAccommodationPricing.currency,
      });
    }

    const courseAmount = resolvedItems
      .filter((item) => item.itemType === 'course')
      .reduce((sum, item) => sum + item.amount, 0);
    const accommodationAmount = resolvedItems
      .filter((item) => item.itemType === 'accommodation')
      .reduce((sum, item) => sum + item.amount, 0);
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

    const commissionCourseAmount = Number(
      resolvedItems
        .filter((item) => item.itemType === 'course')
        .reduce((sum, item) => sum + item.commissionAmount, 0)
        .toFixed(2),
    );

    const commissionAccommodationAmount = Number(
      resolvedItems
        .filter((item) => item.itemType === 'accommodation')
        .reduce((sum, item) => sum + item.commissionAmount, 0)
        .toFixed(2),
    );

    const commissionAmount = Number((commissionCourseAmount + commissionAccommodationAmount).toFixed(2));
    const commissionPercentage = totalAmount
      ? Number(((commissionAmount / totalAmount) * 100).toFixed(4))
      : 0;

    const createdQuote = await this.prisma.enrollmentQuote.create({
      data: {
        enrollmentIntentId: resolvedIntent?.id ?? dto.enrollmentIntentId ?? null,
        coursePricingId: coursePricing?.id ?? null,
        accommodationPricingId: accommodationPricing?.id ?? null,
        courseAmount,
        accommodationAmount,
        fees,
        discounts,
        totalAmount,
        currency: resolvedItems[0]?.currency ?? coursePricing?.currency ?? accommodationPricing?.currency ?? 'CAD',
        downPaymentPercentage,
        downPaymentAmount,
        remainingAmount,
        commissionPercentage,
        commissionAmount,
        commissionCourseAmount,
        commissionAccommodationAmount,
        type,
        items: {
          create: resolvedItems.map((item) => ({
            itemType: item.itemType,
            referenceId: item.referenceId,
            startDate: item.startDate,
            endDate: item.endDate,
            amount: item.amount,
            commissionAmount: item.commissionAmount,
            coursePricingId: item.coursePricingId,
            accommodationPricingId: item.accommodationPricingId,
          })),
        },
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
        items: true,
      },
    });

    if (resolvedIntent?.enrollment?.id) {
      await this.syncEnrollmentPricingFromQuote(resolvedIntent.enrollment.id, createdQuote);
    }

    return createdQuote;
  }

  async findOne(id: string) {
    const quote = await this.prisma.enrollmentQuote.findUnique({
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
        items: true,
      },
    });
    if (!quote) {
      throw new NotFoundException(`Quote ${id} não encontrada`);
    }
    return this.enrichQuote(quote);
  }

  async recalculate(id: string, dto: UpdateEnrollmentQuoteDto) {
    const existing = await this.prisma.enrollmentQuote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(`Quote ${id} não encontrada`);
    }

    const fallbackItems: CreateEnrollmentQuoteItemDto[] = (existing.items ?? []).map((item) => ({
      itemType: item.itemType as 'course' | 'accommodation',
      referenceId: item.referenceId,
      coursePricingId: item.coursePricingId ?? undefined,
      accommodationPricingId: item.accommodationPricingId ?? undefined,
      startDate: item.startDate.toISOString(),
      endDate: item.endDate.toISOString(),
    }));

    const payload: CreateEnrollmentQuoteDto = {
      enrollmentIntentId: dto.enrollmentIntentId ?? existing.enrollmentIntentId ?? undefined,
      items: dto.items?.length ? dto.items : fallbackItems,
      coursePricingId: dto.coursePricingId ?? existing.coursePricingId ?? undefined,
      accommodationPricingId:
        dto.accommodationPricingId ?? existing.accommodationPricingId ?? undefined,
      courseId: dto.courseId,
      academicPeriodId: dto.academicPeriodId,
      accommodationId: dto.accommodationId,
      periodOption: dto.periodOption,
      startDate: dto.startDate,
      endDate: dto.endDate,
      fees: dto.fees ?? this.toNumber(existing.fees),
      discounts: dto.discounts ?? this.toNumber(existing.discounts),
      downPaymentPercentage:
        dto.downPaymentPercentage ?? this.toNumber(existing.downPaymentPercentage),
    };

    return this.create(payload);
  }

  async removeItem(id: string, itemId: string) {
    const existing = await this.prisma.enrollmentQuote.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new NotFoundException(`Quote ${id} não encontrada`);
    }

    const remainingItems: CreateEnrollmentQuoteItemDto[] = (existing.items ?? [])
      .filter((item) => item.id !== itemId)
      .map((item) => ({
        itemType: item.itemType as 'course' | 'accommodation',
        referenceId: item.referenceId,
        coursePricingId: item.coursePricingId ?? undefined,
        accommodationPricingId: item.accommodationPricingId ?? undefined,
        startDate: item.startDate.toISOString(),
        endDate: item.endDate.toISOString(),
      }));

    if (!remainingItems.length) {
      throw new BadRequestException('Pacote precisa ter ao menos 1 item');
    }

    return this.recalculate(id, {
      items: remainingItems,
      fees: this.toNumber(existing.fees),
      discounts: this.toNumber(existing.discounts),
      downPaymentPercentage: this.toNumber(existing.downPaymentPercentage),
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
        items: true,
      },
    });
    if (!quote) {
      throw new NotFoundException(`Quote para intent ${intentId} não encontrada`);
    }
    return this.enrichQuote(quote);
  }

  async findLatestByIntent(intentId: string): Promise<EnrollmentQuote | null> {
    return this.prisma.enrollmentQuote.findFirst({
      where: { enrollmentIntentId: intentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, enrollmentIntentId: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);
    }
    return this.findByIntent(enrollment.enrollmentIntentId);
  }

  async findCurrentByStudent(studentId: string) {
    const activeEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        status: {
          in: ['application_started', 'documents_pending', 'under_review', 'approved', 'enrolled', 'active'],
        },
      },
      select: {
        enrollmentIntentId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingIntent = await this.prisma.enrollmentIntent.findFirst({
      where: { studentId, status: 'pending' },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const latestIntent = await this.prisma.enrollmentIntent.findFirst({
      where: { studentId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const targetIntentId =
      activeEnrollment?.enrollmentIntentId ?? pendingIntent?.id ?? latestIntent?.id ?? null;

    if (!targetIntentId) return null;

    const quote = await this.prisma.enrollmentQuote.findFirst({
      where: { enrollmentIntentId: targetIntentId },
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
        items: true,
      },
    });

    if (!quote) return null;
    return this.enrichQuote(quote);
  }

  async findAll(filters?: {
    type?: string;
    enrollmentIntentId?: string;
    accommodationId?: string;
    courseId?: string;
  }) {
    const quotes = await this.prisma.enrollmentQuote.findMany({
      where: {
        type: filters?.type as EnrollmentQuoteType | undefined,
        enrollmentIntentId: filters?.enrollmentIntentId,
        OR:
          filters?.accommodationId || filters?.courseId
            ? [
                filters?.accommodationId
                  ? {
                      accommodationPricing: {
                        accommodationId: filters.accommodationId,
                      },
                    }
                  : undefined,
                filters?.courseId
                  ? {
                      coursePricing: {
                        courseId: filters.courseId,
                      },
                    }
                  : undefined,
                filters?.accommodationId
                  ? {
                      items: {
                        some: {
                          itemType: 'accommodation',
                          accommodationPricing: {
                            accommodationId: filters.accommodationId,
                          },
                        },
                      },
                    }
                  : undefined,
                filters?.courseId
                  ? {
                      items: {
                        some: {
                          itemType: 'course',
                          coursePricing: {
                            courseId: filters.courseId,
                          },
                        },
                      },
                    }
                  : undefined,
              ].filter(Boolean) as Prisma.EnrollmentQuoteWhereInput[]
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollmentIntent: {
          select: {
            id: true,
            status: true,
            studentId: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
        items: {
          include: {
            coursePricing: {
              select: {
                id: true,
                course: { select: { id: true, program_name: true } },
              },
            },
            accommodationPricing: {
              select: {
                id: true,
                accommodation: {
                  select: { id: true, title: true, accommodationType: true },
                },
              },
            },
          },
        },
      },
    });

    const enriched = await Promise.all(quotes.map((quote) => this.enrichQuote(quote)));
    return enriched;
  }
}
