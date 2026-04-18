import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EnrollmentIntentService } from '../enrollment-intent/enrollment-intent.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  ENROLLMENT_STATUSES,
  type EnrollmentStatus,
} from './enrollment.constants';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CommissionConfigService } from './commission-config.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentIntentService: EnrollmentIntentService,
    private readonly commissionConfigService: CommissionConfigService,
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

  private async upsertPricing(
    tx: TransactionClient,
    enrollment: { id: string; institutionId: string; courseId: string },
    payload: { basePrice?: number; fees?: number; discounts?: number; currency?: string },
  ) {
    const current = await tx.enrollmentPricing.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    const basePrice = payload.basePrice ?? this.toNumber(current?.basePrice);
    const fees = payload.fees ?? this.toNumber(current?.fees);
    const discounts = payload.discounts ?? this.toNumber(current?.discounts);
    const currency = payload.currency ?? current?.currency ?? 'CAD';
    const totalAmount = Math.max(0, basePrice + fees - discounts);

    const commissionConfig = await this.commissionConfigService.resolveForEnrollment({
      institutionId: enrollment.institutionId,
      courseId: enrollment.courseId,
    });
    const commissionPercentage = this.toNumber(commissionConfig?.percentage);
    const fixedAmount = this.toNumber(commissionConfig?.fixedAmount ?? 0);
    const commissionAmount = Number(
      (totalAmount * (commissionPercentage / 100) + fixedAmount).toFixed(2),
    );

    return tx.enrollmentPricing.upsert({
      where: { enrollmentId: enrollment.id },
      create: {
        enrollmentId: enrollment.id,
        basePrice,
        fees,
        discounts,
        totalAmount,
        currency,
        commissionAmount,
        commissionPercentage,
      },
      update: {
        basePrice,
        fees,
        discounts,
        totalAmount,
        currency,
        commissionAmount,
        commissionPercentage,
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
          enrollmentIntentId: intent.id,
          status: 'application_started',
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
  }) {
    return this.prisma.enrollment.findMany({
      where: {
        studentId: filters?.studentId,
        status: filters?.status,
        institutionId: filters?.institutionId,
        schoolId: filters?.schoolId,
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

    const [statusHistory, documents, messages] = await Promise.all([
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
      title: `Mensagem de ${item.sender.firstName} ${item.sender.lastName}`,
      description: item.message,
      sender: item.sender,
    }));

    return [createdEvent, ...statusEvents, ...documentEvents, ...messageEvents].sort(
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
}
