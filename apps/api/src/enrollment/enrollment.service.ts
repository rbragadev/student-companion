import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { NotificationService } from '../notification/notification.service';
import { StartEnrollmentDto } from './dto/start-enrollment.dto';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionConfigService: CommissionConfigService,
    private readonly enrollmentQuoteService: EnrollmentQuoteService,
    private readonly notificationService: NotificationService,
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
    accommodationOrder: {
      select: {
        id: true,
        type: true,
        status: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
        items: {
          select: {
            id: true,
            itemType: true,
            startDate: true,
            endDate: true,
            amount: true,
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
        },
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
    payments: {
      orderBy: { createdAt: 'desc' as const },
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
    const [ongoingEnrollment, anyJourney] = await Promise.all([
      tx.enrollment.findFirst({
        where: { studentId, status: { in: ACTIVE_ENROLLMENT_STATUSES } },
        select: { id: true },
      }),
      tx.enrollment.findFirst({
        where: { studentId },
        select: { id: true },
      }),
    ]);

    const nextStatus = ongoingEnrollment ? 'enrolled' : anyJourney ? 'pending_enrollment' : 'lead';

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
      ? await this.commissionConfigService.resolveForAccommodation({
          accommodationId: enrollment.accommodationId,
          institutionId: enrollment.institutionId,
        })
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

  async start(dto: StartEnrollmentDto) {
    const [course, classGroup, academicPeriod, accommodation] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: dto.courseId },
        include: {
          unit: {
            select: {
              id: true,
              schoolId: true,
              school: { select: { institutionId: true } },
            },
          },
        },
      }),
      this.prisma.classGroup.findUnique({
        where: { id: dto.classGroupId },
        select: { id: true, courseId: true },
      }),
      this.prisma.academicPeriod.findUnique({
        where: { id: dto.academicPeriodId },
        select: { id: true, classGroupId: true },
      }),
      dto.accommodationId
        ? this.prisma.accommodation.findUnique({
            where: { id: dto.accommodationId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!course) {
      throw new NotFoundException(`Curso ${dto.courseId} não encontrado`);
    }
    if (!classGroup) {
      throw new NotFoundException(`Turma ${dto.classGroupId} não encontrada`);
    }
    if (!academicPeriod) {
      throw new NotFoundException(`Período acadêmico ${dto.academicPeriodId} não encontrado`);
    }
    if (dto.accommodationId && !accommodation) {
      throw new NotFoundException(`Acomodação ${dto.accommodationId} não encontrada`);
    }
    if (classGroup.courseId !== course.id) {
      throw new BadRequestException('Turma não pertence ao curso selecionado');
    }
    if (academicPeriod.classGroupId !== classGroup.id) {
      throw new BadRequestException('Período acadêmico não pertence à turma selecionada');
    }

    const activeEnrollment = await this.findActiveByStudent(dto.studentId);
    if (activeEnrollment) {
      if (['draft', 'started'].includes(activeEnrollment.status)) {
        return this.prisma.enrollment.update({
          where: { id: activeEnrollment.id },
          data: {
            institutionId: course.unit.school.institutionId,
            schoolId: course.unit.schoolId,
            unitId: course.unit.id,
            courseId: course.id,
            classGroupId: classGroup.id,
            academicPeriodId: academicPeriod.id,
            accommodationId: dto.accommodationId ?? null,
            accommodationStatus: dto.accommodationId ? 'selected' : 'not_selected',
          },
          include: this.includeDetailGraph,
        });
      }
      return this.findOne(activeEnrollment.id);
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({
        data: {
          studentId: dto.studentId,
          institutionId: course.unit.school.institutionId,
          schoolId: course.unit.schoolId,
          unitId: course.unit.id,
          courseId: course.id,
          classGroupId: classGroup.id,
          academicPeriodId: academicPeriod.id,
          accommodationId: dto.accommodationId ?? null,
          status: 'started',
          accommodationStatus: dto.accommodationId ? 'selected' : 'not_selected',
        },
        include: this.includeDetailGraph,
      });

      await this.registerStatusHistory(
        tx,
        created.id,
        null,
        'started',
        'Matrícula iniciada pelo fluxo de pacote',
        null,
      );

      if (dto.accommodationId) {
        await this.registerAccommodationStatusHistory(
          tx,
          created.id,
          null,
          'selected',
          'Acomodação selecionada durante início do pacote',
          null,
        );
      }

      await this.recalculateStudentStatus(tx, dto.studentId);
      return created;
    });
  }

  findAll(filters?: {
    studentId?: string;
    status?: string;
    institutionId?: string;
    schoolId?: string;
    courseId?: string;
    accommodationId?: string;
    accommodationStatus?: string;
  }) {
    return this.prisma.enrollment.findMany({
      where: {
        studentId: filters?.studentId,
        status: filters?.status,
        institutionId: filters?.institutionId,
        schoolId: filters?.schoolId,
        courseId: filters?.courseId,
        accommodationId: filters?.accommodationId,
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

    const [activeEnrollment, enrollmentHistory] = await Promise.all([
      this.findActiveByStudent(studentId),
      this.prisma.enrollment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: this.includeListGraph,
      }),
    ]);

    return {
      activeEnrollment,
      enrollmentHistory,
    };
  }

  async getTimeline(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      select: { id: true, createdAt: true, status: true },
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${id} não encontrada`);

    const [statusHistory, documents, messages, accommodationStatusHistory, payments] = await Promise.all([
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
      this.prisma.payment.findMany({
        where: { enrollmentId: id },
        orderBy: { createdAt: 'asc' },
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

    const paymentEvents = payments.map((item) => ({
      id: `payment-${item.id}`,
      type: 'payment',
      occurredAt: item.paidAt ?? item.createdAt,
      title:
        item.status === 'paid'
          ? 'Pagamento confirmado'
          : `Pagamento ${item.status}`,
      description: `${this.toNumber(item.amount).toFixed(2)} ${item.currency} (${item.type})`,
      channel: 'enrollment',
    }));

    return [
      createdEvent,
      ...statusEvents,
      ...accommodationEvents,
      ...documentEvents,
      ...messageEvents,
      ...paymentEvents,
    ].sort(
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

    const updated = await this.prisma.$transaction(async (tx) => {
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

    if (status === 'approved') {
      await this.notificationService.create({
        userId: enrollment.student.id,
        type: 'proposal_approved',
        title: 'Proposta aprovada',
        message:
          'Sua proposta foi aprovada pela operação. Acesse a matrícula para concluir o checkout.',
        metadata: {
          enrollmentId: id,
        },
      });
    }

    if (status === 'rejected' || status === 'cancelled' || status === 'expired' || status === 'closed') {
      await this.notificationService.create({
        userId: enrollment.student.id,
        type: 'proposal_rejected',
        title: 'Proposta rejeitada',
        message: reason?.trim()
          ? `Sua proposta foi rejeitada: ${reason.trim()}`
          : 'Sua proposta foi rejeitada/cancelada pela operação.',
          metadata: {
            enrollmentId: id,
            status,
          },
        });
    }

    return updated;
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);
    const requestedStatus = dto.status;
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

    const updatedEnrollment = await this.prisma.$transaction(async (tx) => {
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

    if (requestedStatus && requestedStatus !== enrollment.status) {
      if (requestedStatus === 'approved') {
        await this.notificationService.create({
          userId: enrollment.student.id,
          type: 'proposal_approved',
          title: 'Proposta aprovada',
          message:
            'Sua proposta foi aprovada pela operação. Acesse a matrícula para concluir o checkout.',
          metadata: {
            enrollmentId: id,
          },
        });
      }

      if (
        requestedStatus === 'rejected' ||
        requestedStatus === 'cancelled' ||
        requestedStatus === 'expired' ||
        requestedStatus === 'closed'
      ) {
        await this.notificationService.create({
          userId: enrollment.student.id,
          type: 'proposal_rejected',
          title: 'Proposta rejeitada',
          message: dto.reason?.trim()
            ? `Sua proposta foi rejeitada: ${dto.reason.trim()}`
            : 'Sua proposta foi rejeitada/cancelada pela operação.',
          metadata: {
            enrollmentId: id,
            status: requestedStatus,
          },
        });
      }
    }

    return updatedEnrollment;
  }

  private async validateAccommodationForSchool(
    tx: TransactionClient,
    schoolId: string,
    accommodationId?: string | null,
  ) {
    if (!accommodationId) return null;

    const accommodation = await tx.accommodation.findUnique({
      where: { id: accommodationId },
      select: { id: true, isActive: true },
    });

    if (!accommodation || accommodation.isActive === false) {
      throw new NotFoundException(`Acomodação ${accommodationId} não encontrada ou inativa`);
    }

    // Recomendação por escola segue como sinal de prioridade no upsell.
    // A operação pode fechar com acomodação não recomendada.
    void schoolId;

    return accommodationId;
  }

  async setAccommodation(id: string, accommodationId?: string | null) {
    const enrollment = await this.findOne(id);
    const hasConfirmedDownPayment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId: id,
        type: 'down_payment',
        status: 'paid',
      },
      select: { id: true },
    });

    if (hasConfirmedDownPayment) {
      throw new BadRequestException(
        'Pagamento de entrada já confirmado. A acomodação do pacote não pode mais ser alterada',
      );
    }

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

      if (nextAccommodationId) {
        const accommodation = await tx.accommodation.findUnique({
          where: { id: nextAccommodationId },
          select: { id: true, priceInCents: true },
        });
        if (!accommodation) {
          throw new NotFoundException(`Acomodação ${nextAccommodationId} não encontrada`);
        }
        const amount = Number((accommodation.priceInCents / 100).toFixed(2));
        const linkedOrder = await tx.order.create({
          data: {
            userId: enrollment.student.id,
            enrollmentId: enrollment.id,
            type: 'accommodation',
            status: 'submitted',
            totalAmount: amount,
            currency: 'CAD',
            paymentStatus: hasConfirmedDownPayment ? 'paid' : 'pending',
            items: {
              create: {
                itemType: 'accommodation',
                referenceId: nextAccommodationId,
                startDate: enrollment.academicPeriod.startDate,
                endDate: enrollment.academicPeriod.endDate,
                amount,
                accommodationId: nextAccommodationId,
              },
            },
          },
          select: { id: true },
        });

        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { accommodationOrderId: linkedOrder.id },
        });
      } else {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { accommodationOrderId: null },
        });
      }

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

  async setAccommodationOrder(id: string, orderId?: string | null) {
    const enrollment = await this.findOne(id);
    const hasConfirmedDownPayment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId: id,
        type: 'down_payment',
        status: 'paid',
      },
      select: { id: true },
    });

    if (hasConfirmedDownPayment) {
      throw new BadRequestException(
        'Pagamento de entrada já confirmado. Não é possível alterar order de acomodação.',
      );
    }

    if (!orderId) {
      return this.prisma.enrollment.update({
        where: { id },
        data: {
          accommodationOrderId: null,
          accommodationId: null,
          accommodationStatus: 'not_selected',
          accommodationClosedAt: null,
        },
        include: this.includeDetailGraph,
      });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { itemType: 'accommodation' },
          include: { accommodation: { select: { id: true } } },
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} não encontrada`);
    }
    if (order.userId !== enrollment.student.id) {
      throw new BadRequestException('Order de acomodação pertence a outro aluno');
    }
    const accommodationItem = order.items.find((item) => item.accommodationId);
    if (!accommodationItem?.accommodationId) {
      throw new BadRequestException('Order não possui item de acomodação');
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        accommodationOrderId: order.id,
        accommodationId: accommodationItem.accommodationId,
        accommodationStatus: enrollment.accommodationStatus === 'not_selected' ? 'selected' : enrollment.accommodationStatus,
      },
      include: this.includeDetailGraph,
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
    const hasConfirmedDownPayment = await this.prisma.payment.findFirst({
      where: {
        enrollmentId: id,
        type: 'down_payment',
        status: 'paid',
      },
      select: { id: true },
    });

    if (hasConfirmedDownPayment && status !== enrollment.accommodationStatus) {
      throw new BadRequestException(
        'Pagamento de entrada já confirmado. O workflow da acomodação está bloqueado',
      );
    }

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
    const latestQuote = await this.enrollmentQuoteService.findLatestByEnrollment(enrollment.id);
    const pricing = enrollment.pricing;

    const hasStalePricing =
      !!pricing &&
      this.toNumber(pricing.packageTotalAmount ?? pricing.totalAmount) <= 0 &&
      !!latestQuote &&
      this.toNumber(latestQuote.totalAmount) > 0;

    const pricingSummary =
      latestQuote && (!pricing || hasStalePricing)
        ? {
            currency: latestQuote.currency,
            enrollmentAmount: this.toNumber(latestQuote.courseAmount),
            accommodationAmount: this.toNumber(latestQuote.accommodationAmount),
            packageTotalAmount: this.toNumber(latestQuote.totalAmount),
            enrollmentCommissionAmount: this.toNumber(latestQuote.commissionCourseAmount),
            accommodationCommissionAmount: this.toNumber(
              latestQuote.commissionAccommodationAmount,
            ),
            totalCommissionAmount: this.toNumber(latestQuote.commissionAmount),
            commissionPercentage: this.toNumber(latestQuote.commissionPercentage),
          }
        : pricing
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
              accommodationAmount: 0,
              packageTotalAmount: 0,
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
      accommodation:
        enrollment.accommodationOrder?.items.find((item) => item.itemType === 'accommodation')
          ?.accommodation ?? enrollment.accommodation,
      accommodationOrder: enrollment.accommodationOrder
        ? {
            id: enrollment.accommodationOrder.id,
            type: enrollment.accommodationOrder.type,
            status: enrollment.accommodationOrder.status,
            totalAmount: this.toNumber(enrollment.accommodationOrder.totalAmount),
            currency: enrollment.accommodationOrder.currency,
            paymentStatus: enrollment.accommodationOrder.paymentStatus,
          }
        : null,
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
