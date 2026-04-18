import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EnrollmentIntentService } from '../enrollment-intent/enrollment-intent.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ENROLLMENT_ACCOMMODATION_STATUSES,
  ACTIVE_ENROLLMENT_STATUSES,
  ENROLLMENT_STATUSES,
  type EnrollmentAccommodationStatus,
  type EnrollmentStatus,
} from './enrollment.constants';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CommissionConfigService } from './commission-config.service';
import { EnrollmentQuoteService } from './enrollment-quote.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentIntentService: EnrollmentIntentService,
    private readonly commissionConfigService: CommissionConfigService,
    private readonly enrollmentQuoteService: EnrollmentQuoteService,
  ) {}

  private readonly includeListGraph = {
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentStatus: true,
      },
    },
    institution: { select: { id: true, name: true } },
    school: { select: { id: true, name: true } },
    unit: { select: { id: true, name: true, code: true } },
    course: { select: { id: true, program_name: true } },
    classGroup: { select: { id: true, name: true, code: true } },
    academicPeriod: {
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    },
    accommodation: {
      select: {
        id: true,
        title: true,
        accommodationType: true,
        location: true,
        priceInCents: true,
        priceUnit: true,
        score: true,
      },
    },
    enrollmentIntent: {
      select: {
        id: true,
        status: true,
        convertedAt: true,
      },
    },
    pricing: true,
  } as const;

  private readonly includeDetailGraph = {
    ...this.includeListGraph,
    documents: {
      orderBy: { createdAt: 'desc' as const },
    },
    messages: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    },
    statusHistory: {
      orderBy: { createdAt: 'desc' as const },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    },
    accommodationStatusHistory: {
      orderBy: { createdAt: 'desc' as const },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    },
  } as const;

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private assertValidStatus(status: string): asserts status is EnrollmentStatus {
    if (!ENROLLMENT_STATUSES.includes(status as EnrollmentStatus)) {
      throw new BadRequestException('Status de matrícula inválido');
    }
  }

  private assertValidAccommodationStatus(
    status: string,
  ): asserts status is EnrollmentAccommodationStatus {
    if (!ENROLLMENT_ACCOMMODATION_STATUSES.includes(status as EnrollmentAccommodationStatus)) {
      throw new BadRequestException('Status de acomodação inválido');
    }
  }

  private async recalculateStudentStatus(tx: TransactionClient, studentId: string) {
    const [ongoingEnrollment, pendingIntent, anyJourney] = await Promise.all([
      tx.enrollment.findFirst({
        where: { studentId, status: { in: ACTIVE_ENROLLMENT_STATUSES } },
        select: { id: true },
      }),
      tx.enrollmentIntent.findFirst({
        where: { studentId, status: 'pending' },
        select: { id: true },
      }),
      tx.enrollmentIntent.findFirst({
        where: { studentId },
        select: { id: true },
      }),
    ]);

    const nextStatus = ongoingEnrollment
      ? 'enrolled'
      : pendingIntent
        ? 'pending_enrollment'
        : anyJourney
          ? 'application_started'
          : 'lead';

    await tx.user.update({
      where: { id: studentId },
      data: { studentStatus: nextStatus },
    });
  }

  private async registerStatusHistory(
    tx: TransactionClient,
    enrollmentId: string,
    fromStatus: string | null,
    toStatus: string,
    reason?: string | null,
    changedById?: string | null,
  ) {
    await tx.enrollmentStatusHistory.create({
      data: {
        enrollmentId,
        fromStatus,
        toStatus,
        reason: reason ?? null,
        changedById: changedById ?? null,
      },
    });
  }

  private async registerAccommodationStatusHistory(
    tx: TransactionClient,
    enrollmentId: string,
    fromStatus: string | null,
    toStatus: string,
    reason?: string | null,
    changedById?: string | null,
  ) {
    await tx.enrollmentAccommodationStatusHistory.create({
      data: {
        enrollmentId,
        fromStatus,
        toStatus,
        reason: reason ?? null,
        changedById: changedById ?? null,
      },
    });
  }

  private async upsertPricing(
    tx: TransactionClient,
    enrollment: { id: string; institutionId: string; courseId: string; schoolId: string; accommodationId?: string | null },
    payload: { basePrice?: number; fees?: number; discounts?: number; currency?: string },
  ) {
    const current = await tx.enrollmentPricing.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    const basePrice = payload.basePrice ?? this.toNumber(current?.basePrice);
    const fees = payload.fees ?? this.toNumber(current?.fees);
    const discounts = payload.discounts ?? this.toNumber(current?.discounts);
    const currency = payload.currency ?? current?.currency ?? 'CAD';
    const enrollmentAmount = Math.max(0, basePrice + fees - discounts);

    let accommodationAmount = 0;
    if (enrollment.accommodationId) {
      const accommodation = await tx.accommodation.findUnique({
        where: { id: enrollment.accommodationId },
        select: { priceInCents: true, isActive: true },
      });
      if (accommodation && accommodation.isActive !== false) {
        accommodationAmount = this.toNumber(accommodation.priceInCents) / 100;
      }
    }

    const packageTotalAmount = Math.max(0, enrollmentAmount + accommodationAmount);

    const commissionConfig = await this.commissionConfigService.resolveForEnrollment({
      institutionId: enrollment.institutionId,
      courseId: enrollment.courseId,
    });
    const enrollmentCommissionPercentage = this.toNumber(commissionConfig?.percentage);
    const enrollmentFixedAmount = this.toNumber(commissionConfig?.fixedAmount ?? 0);
    const enrollmentCommissionAmount = Number(
      (enrollmentAmount * (enrollmentCommissionPercentage / 100) + enrollmentFixedAmount).toFixed(2),
    );

    const accommodationCommissionConfig = enrollment.accommodationId
      ? await this.commissionConfigService.resolveForAccommodation(enrollment.accommodationId)
      : null;
    const accommodationCommissionPercentage = this.toNumber(
      accommodationCommissionConfig?.percentage,
    );
    const accommodationFixedAmount = this.toNumber(accommodationCommissionConfig?.fixedAmount ?? 0);
    const accommodationCommissionAmount = Number(
      (accommodationAmount * (accommodationCommissionPercentage / 100) + accommodationFixedAmount).toFixed(
        2,
      ),
    );

    const totalCommissionAmount = Number(
      (enrollmentCommissionAmount + accommodationCommissionAmount).toFixed(2),
    );
    const effectiveCommissionPercentage = packageTotalAmount
      ? Number(((totalCommissionAmount / packageTotalAmount) * 100).toFixed(4))
      : 0;

    return tx.enrollmentPricing.upsert({
      where: { enrollmentId: enrollment.id },
      create: {
        enrollmentId: enrollment.id,
        basePrice,
        fees,
        discounts,
        totalAmount: packageTotalAmount,
        enrollmentAmount,
        accommodationAmount,
        packageTotalAmount,
        currency,
        commissionAmount: totalCommissionAmount,
        commissionPercentage: effectiveCommissionPercentage,
        enrollmentCommissionAmount,
        enrollmentCommissionPercentage,
        accommodationCommissionAmount,
        accommodationCommissionPercentage,
        totalCommissionAmount,
      },
      update: {
        basePrice,
        fees,
        discounts,
        totalAmount: packageTotalAmount,
        enrollmentAmount,
        accommodationAmount,
        packageTotalAmount,
        currency,
        commissionAmount: totalCommissionAmount,
        commissionPercentage: effectiveCommissionPercentage,
        enrollmentCommissionAmount,
        enrollmentCommissionPercentage,
        accommodationCommissionAmount,
        accommodationCommissionPercentage,
        totalCommissionAmount,
      },
    });
  }

  async createFromIntent(intentId: string) {
    const { intent, chain } = await this.enrollmentIntentService.resolveIntentForEnrollment(intentId);

    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: intent.studentId,
          institutionId: chain.institutionId,
          schoolId: chain.schoolId,
          unitId: chain.unitId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId: intent.accommodationId,
          enrollmentIntentId: intent.id,
          status: 'application_started',
          accommodationStatus: intent.accommodationId ? 'selected' : 'not_selected',
          accommodationClosedAt: null,
        },
      });

      await this.registerStatusHistory(
        tx,
        enrollment.id,
        null,
        'application_started',
        'Matrícula criada a partir da intenção',
        null,
      );

      await tx.enrollmentIntent.update({
        where: { id: intent.id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
        },
      });

      await this.recalculateStudentStatus(tx, intent.studentId);

      const latestQuote = await this.enrollmentQuoteService.findLatestByIntent(intent.id);
      if (latestQuote) {
        await tx.enrollmentPricing.upsert({
          where: { enrollmentId: enrollment.id },
          create: {
            enrollmentId: enrollment.id,
            basePrice: this.toNumber(latestQuote.courseAmount),
            fees: this.toNumber(latestQuote.fees),
            discounts: this.toNumber(latestQuote.discounts),
            totalAmount: this.toNumber(latestQuote.totalAmount),
            enrollmentAmount: this.toNumber(latestQuote.courseAmount),
            accommodationAmount: this.toNumber(latestQuote.accommodationAmount),
            packageTotalAmount: this.toNumber(latestQuote.totalAmount),
            currency: latestQuote.currency,
            commissionAmount: this.toNumber(latestQuote.commissionAmount),
            commissionPercentage: this.toNumber(latestQuote.commissionPercentage),
            enrollmentCommissionAmount: this.toNumber(latestQuote.commissionCourseAmount),
            enrollmentCommissionPercentage: this.toNumber(latestQuote.commissionPercentage),
            accommodationCommissionAmount: this.toNumber(
              latestQuote.commissionAccommodationAmount,
            ),
            accommodationCommissionPercentage: 0,
            totalCommissionAmount: this.toNumber(latestQuote.commissionAmount),
          },
          update: {
            basePrice: this.toNumber(latestQuote.courseAmount),
            fees: this.toNumber(latestQuote.fees),
            discounts: this.toNumber(latestQuote.discounts),
            totalAmount: this.toNumber(latestQuote.totalAmount),
            enrollmentAmount: this.toNumber(latestQuote.courseAmount),
            accommodationAmount: this.toNumber(latestQuote.accommodationAmount),
            packageTotalAmount: this.toNumber(latestQuote.totalAmount),
            currency: latestQuote.currency,
            commissionAmount: this.toNumber(latestQuote.commissionAmount),
            commissionPercentage: this.toNumber(latestQuote.commissionPercentage),
            enrollmentCommissionAmount: this.toNumber(latestQuote.commissionCourseAmount),
            accommodationCommissionAmount: this.toNumber(
              latestQuote.commissionAccommodationAmount,
            ),
            totalCommissionAmount: this.toNumber(latestQuote.commissionAmount),
          },
        });
      }

      return tx.enrollment.findUnique({
        where: { id: enrollment.id },
        include: this.includeDetailGraph,
      });
    });
  }

  findAll(filters?: {
    studentId?: string;
    status?: string;
    institutionId?: string;
    schoolId?: string;
    accommodationStatus?: string;
  }) {
    return this.prisma.enrollment.findMany({
      where: {
        studentId: filters?.studentId,
        status: filters?.status,
        institutionId: filters?.institutionId,
        schoolId: filters?.schoolId,
        accommodationStatus: filters?.accommodationStatus,
      },
      orderBy: { createdAt: 'desc' },
      include: this.includeListGraph,
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.includeDetailGraph,
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${id} não encontrada`);
    return enrollment;
  }

  async findActiveByStudent(studentId: string) {
    if (!studentId) {
      throw new BadRequestException('studentId é obrigatório');
    }
    return this.prisma.enrollment.findFirst({
      where: { studentId, status: { in: ACTIVE_ENROLLMENT_STATUSES } },
      orderBy: { createdAt: 'desc' },
      include: this.includeListGraph,
    });
  }

  async getStudentJourney(studentId: string) {
    if (!studentId) {
      throw new BadRequestException('studentId é obrigatório');
    }

    const [activeIntent, activeEnrollment, intentHistory, enrollmentHistory] = await Promise.all([
      this.prisma.enrollmentIntent.findFirst({
        where: { studentId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              program_name: true,
              school: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true, code: true } },
            },
          },
          classGroup: { select: { id: true, name: true, code: true } },
          academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
          accommodation: {
            select: {
              id: true,
              title: true,
              accommodationType: true,
              location: true,
              priceInCents: true,
              priceUnit: true,
              score: true,
            },
          },
        },
      }),
      this.findActiveByStudent(studentId),
      this.prisma.enrollmentIntent.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              program_name: true,
              school: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true, code: true } },
            },
          },
          classGroup: { select: { id: true, name: true, code: true } },
          academicPeriod: { select: { id: true, name: true, startDate: true, endDate: true } },
          accommodation: {
            select: {
              id: true,
              title: true,
              accommodationType: true,
              location: true,
              priceInCents: true,
              priceUnit: true,
              score: true,
            },
          },
          enrollment: { select: { id: true, status: true, createdAt: true } },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: this.includeListGraph,
      }),
    ]);

    return {
      activeIntent,
      activeEnrollment,
      intentHistory,
      enrollmentHistory,
    };
  }

  async getTimeline(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      select: { id: true, createdAt: true, status: true },
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${id} não encontrada`);

    const [statusHistory, documents, messages, accommodationStatusHistory] = await Promise.all([
      this.prisma.enrollmentStatusHistory.findMany({
        where: { enrollmentId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          changedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      this.prisma.enrollmentDocument.findMany({
        where: { enrollmentId: id },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.enrollmentMessage.findMany({
        where: { enrollmentId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      this.prisma.enrollmentAccommodationStatusHistory.findMany({
        where: { enrollmentId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          changedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
    ]);

    const createdEvent = {
      id: `enrollment-created-${enrollment.id}`,
      type: 'enrollment_created',
      occurredAt: enrollment.createdAt,
      title: 'Matrícula criada',
      description: `Status inicial: ${enrollment.status}`,
    };

    const statusEvents = statusHistory.map((item) => ({
      id: item.id,
      type: 'status_changed',
      occurredAt: item.createdAt,
      title: `Status alterado para ${item.toStatus}`,
      description: item.reason ?? null,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      changedBy: item.changedBy,
    }));

    const documentEvents = documents.map((item) => ({
      id: item.id,
      type: 'document',
      occurredAt: item.createdAt,
      title: `Documento ${item.type}`,
      description: `Status: ${item.status}`,
      meta: {
        fileUrl: item.fileUrl,
        adminNote: item.adminNote,
      },
    }));

    const messageEvents = messages.map((item) => ({
      id: item.id,
      type: 'message',
      occurredAt: item.createdAt,
      title:
        item.channel === 'accommodation'
          ? `Mensagem (acomodação) de ${item.sender.firstName} ${item.sender.lastName}`
          : `Mensagem de ${item.sender.firstName} ${item.sender.lastName}`,
      description: item.message,
      sender: item.sender,
      channel: item.channel,
    }));

    const accommodationEvents = accommodationStatusHistory.map((item) => ({
      id: `accommodation-${item.id}`,
      type: 'accommodation_status_changed',
      occurredAt: item.createdAt,
      title: `Acomodação ${item.toStatus}`,
      description: item.reason ?? null,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      changedBy: item.changedBy,
    }));

    return [createdEvent, ...statusEvents, ...accommodationEvents, ...documentEvents, ...messageEvents].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
  }

  async updateStatus(
    id: string,
    status: EnrollmentStatus,
    reason?: string,
    changedById?: string,
  ) {
    this.assertValidStatus(status);
    const enrollment = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id },
        data: { status },
        include: this.includeDetailGraph,
      });

      if (enrollment.status !== status) {
        await this.registerStatusHistory(
          tx,
          id,
          enrollment.status,
          status,
          reason ?? null,
          changedById ?? null,
        );
      }

      await this.recalculateStudentStatus(tx, enrollment.student.id);
      return updated;
    });
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);
    const hasPricingPayload =
      dto.basePrice !== undefined ||
      dto.fees !== undefined ||
      dto.discounts !== undefined ||
      dto.currency !== undefined;

    if (!dto.status && !hasPricingPayload) {
      throw new BadRequestException(
        'Informe ao menos um campo de atualização: status, basePrice, fees, discounts ou currency',
      );
    }

    if (dto.status) {
      this.assertValidStatus(dto.status);
    }

    return this.prisma.$transaction(async (tx) => {
      let updatedEnrollment = enrollment;

      if (dto.status && dto.status !== enrollment.status) {
        updatedEnrollment = await tx.enrollment.update({
          where: { id },
          data: { status: dto.status },
          include: this.includeDetailGraph,
        });

        await this.registerStatusHistory(
          tx,
          id,
          enrollment.status,
          dto.status,
          dto.reason ?? null,
          dto.changedById ?? null,
        );
      }

      if (hasPricingPayload) {
        await this.upsertPricing(
          tx,
          {
            id: enrollment.id,
            institutionId: enrollment.institution.id,
            courseId: enrollment.course.id,
            schoolId: enrollment.school.id,
            accommodationId: enrollment.accommodation?.id ?? null,
          },
          {
            basePrice: dto.basePrice,
            fees: dto.fees,
            discounts: dto.discounts,
            currency: dto.currency,
          },
        );
      }

      await this.recalculateStudentStatus(tx, enrollment.student.id);
      return tx.enrollment.findUnique({
        where: { id },
        include: this.includeDetailGraph,
      });
    });
  }

  private async validateAccommodationForSchool(
    tx: TransactionClient,
    schoolId: string,
    accommodationId?: string | null,
  ) {
    if (!accommodationId) return null;

    const [accommodation, recommendation] = await Promise.all([
      tx.accommodation.findUnique({
        where: { id: accommodationId },
        select: { id: true, isActive: true },
      }),
      tx.schoolAccommodationRecommendation.findFirst({
        where: {
          schoolId,
          accommodationId,
          isRecommended: true,
        },
        select: { id: true },
      }),
    ]);

    if (!accommodation || accommodation.isActive === false) {
      throw new NotFoundException(`Acomodação ${accommodationId} não encontrada ou inativa`);
    }
    if (!recommendation) {
      throw new BadRequestException(
        'A acomodação selecionada não está recomendada para a escola da matrícula',
      );
    }

    return accommodationId;
  }

  async setAccommodation(id: string, accommodationId?: string | null) {
    const enrollment = await this.findOne(id);
    if (enrollment.accommodationStatus === 'closed') {
      throw new BadRequestException(
        'A acomodação já está fechada para esta matrícula e não pode ser alterada',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const nextAccommodationId = await this.validateAccommodationForSchool(
        tx,
        enrollment.school.id,
        accommodationId ?? null,
      );

      const updated = await tx.enrollment.update({
        where: { id },
        data: {
          accommodationId: nextAccommodationId,
          accommodationStatus: nextAccommodationId ? enrollment.accommodationStatus === 'not_selected' ? 'selected' : enrollment.accommodationStatus : 'not_selected',
          accommodationClosedAt: nextAccommodationId ? enrollment.accommodationClosedAt : null,
        },
        include: this.includeDetailGraph,
      });

      const nextStatus = updated.accommodationStatus;
      if (nextStatus !== enrollment.accommodationStatus) {
        await this.registerAccommodationStatusHistory(
          tx,
          enrollment.id,
          enrollment.accommodationStatus,
          nextStatus,
          nextAccommodationId ? 'Acomodação vinculada ao pacote' : 'Acomodação removida do pacote',
          null,
        );
      }

      const existingPricing = await tx.enrollmentPricing.findUnique({
        where: { enrollmentId: id },
      });

      if (existingPricing) {
        await this.upsertPricing(
          tx,
          {
            id: enrollment.id,
            institutionId: enrollment.institution.id,
            courseId: enrollment.course.id,
            schoolId: enrollment.school.id,
            accommodationId: nextAccommodationId,
          },
          {
            basePrice: this.toNumber(existingPricing.basePrice),
            fees: this.toNumber(existingPricing.fees),
            discounts: this.toNumber(existingPricing.discounts),
            currency: existingPricing.currency,
          },
        );
      }

      return tx.enrollment.findUnique({
        where: { id },
        include: this.includeDetailGraph,
      });
    });
  }

  async updateAccommodationWorkflow(
    id: string,
    status: EnrollmentAccommodationStatus,
    reason?: string,
    changedById?: string,
  ) {
    this.assertValidAccommodationStatus(status);
    const enrollment = await this.findOne(id);

    if (!enrollment.accommodation && status !== 'not_selected') {
      throw new BadRequestException('Selecione uma acomodação antes de operar o workflow');
    }
    if (enrollment.accommodationStatus === 'closed' && status !== 'closed') {
      throw new BadRequestException('A acomodação já está fechada e não pode voltar de status');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id },
        data: {
          accommodationStatus: status,
          accommodationClosedAt: status === 'closed' ? new Date() : null,
        },
        include: this.includeDetailGraph,
      });

      if (status !== enrollment.accommodationStatus) {
        await this.registerAccommodationStatusHistory(
          tx,
          id,
          enrollment.accommodationStatus,
          status,
          reason ?? null,
          changedById ?? null,
        );
      }

      return updated;
    });
  }

  async getPackageSummary(id: string) {
    const enrollment = await this.findOne(id);
    const latestQuote = await this.enrollmentQuoteService.findLatestByIntent(
      enrollment.enrollmentIntent.id,
    );
    const pricing = enrollment.pricing;
    const fallbackAccommodationAmount = enrollment.accommodation
      ? this.toNumber(enrollment.accommodation.priceInCents) / 100
      : 0;

    const pricingSummary = pricing
      ? {
          currency: pricing.currency,
          enrollmentAmount: this.toNumber(pricing.enrollmentAmount ?? pricing.basePrice),
          accommodationAmount: this.toNumber(pricing.accommodationAmount),
          packageTotalAmount: this.toNumber(pricing.packageTotalAmount ?? pricing.totalAmount),
          enrollmentCommissionAmount: this.toNumber(pricing.enrollmentCommissionAmount),
          accommodationCommissionAmount: this.toNumber(pricing.accommodationCommissionAmount),
          totalCommissionAmount: this.toNumber(
            pricing.totalCommissionAmount ?? pricing.commissionAmount,
          ),
          commissionPercentage: this.toNumber(pricing.commissionPercentage),
        }
      : {
          currency: 'CAD',
          enrollmentAmount: 0,
          accommodationAmount: fallbackAccommodationAmount,
          packageTotalAmount: fallbackAccommodationAmount,
          enrollmentCommissionAmount: 0,
          accommodationCommissionAmount: 0,
          totalCommissionAmount: 0,
          commissionPercentage: 0,
        };

    return {
      enrollmentId: enrollment.id,
      student: enrollment.student,
      institution: enrollment.institution,
      school: enrollment.school,
      course: enrollment.course,
      accommodation: enrollment.accommodation,
      accommodationStatus: enrollment.accommodationStatus,
      accommodationClosedAt: enrollment.accommodationClosedAt,
      pricing: pricingSummary,
      quote: latestQuote
        ? {
            id: latestQuote.id,
            type: latestQuote.type,
            downPaymentPercentage: this.toNumber(latestQuote.downPaymentPercentage),
            downPaymentAmount: this.toNumber(latestQuote.downPaymentAmount),
            remainingAmount: this.toNumber(latestQuote.remainingAmount),
          }
        : null,
    };
  }
}
