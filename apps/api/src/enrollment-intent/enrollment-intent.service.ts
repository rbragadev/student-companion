import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentIntentDto } from './dto/create-enrollment-intent.dto';
import { UpdateEnrollmentIntentDto } from './dto/update-enrollment-intent.dto';
import { ACTIVE_ENROLLMENT_STATUSES } from '../enrollment/enrollment.constants';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class EnrollmentIntentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly includeEnrollmentGraph = {
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentStatus: true,
      },
    },
    course: {
      select: {
        id: true,
        program_name: true,
        school: {
          select: {
            id: true,
            name: true,
            institution: { select: { id: true, name: true } },
          },
        },
      },
    },
    classGroup: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
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
  } as const;

  private readonly activeLifecycleStatuses = [
    'draft',
    'started',
    'awaiting_school_approval',
    'approved',
    'checkout_available',
    'payment_pending',
    'partially_paid',
    'application_started',
    ...ACTIVE_ENROLLMENT_STATUSES,
  ];

  private toLegacyIntentStatus(enrollmentStatus: string): 'pending' | 'converted' | 'cancelled' | 'denied' {
    if (['cancelled', 'expired'].includes(enrollmentStatus)) return 'cancelled';
    if (['rejected', 'denied'].includes(enrollmentStatus)) return 'denied';
    if (
      [
        'approved',
        'checkout_available',
        'payment_pending',
        'partially_paid',
        'paid',
        'confirmed',
        'enrolled',
      ].includes(enrollmentStatus)
    ) {
      return 'converted';
    }
    return 'pending';
  }

  private fromLegacyStatusFilter(
    status?: string,
  ): Prisma.EnrollmentWhereInput['status'] | undefined {
    if (!status) return undefined;
    if (status === 'pending') {
      return {
        in: ['draft', 'started', 'awaiting_school_approval', 'application_started', 'under_review'],
      };
    }
    if (status === 'converted') {
      return { in: ['approved', 'checkout_available', 'payment_pending', 'partially_paid', 'paid', 'confirmed', 'enrolled'] };
    }
    if (status === 'cancelled') {
      return { in: ['cancelled', 'expired'] };
    }
    if (status === 'denied') {
      return { in: ['rejected', 'denied'] };
    }
    return status;
  }

  private async recalculateStudentStatus(
    tx: Prisma.TransactionClient,
    studentId: string,
  ) {
    const [ongoingEnrollment, anyJourney] = await Promise.all([
      tx.enrollment.findFirst({
        where: { studentId, status: { in: this.activeLifecycleStatuses } },
        select: { id: true },
      }),
      tx.enrollment.findFirst({
        where: { studentId },
        select: { id: true },
      }),
    ]);

    const nextStatus = ongoingEnrollment ? 'pending_enrollment' : anyJourney ? 'application_started' : 'lead';

    await tx.user.update({
      where: { id: studentId },
      data: { studentStatus: nextStatus },
    });
  }

  private mapEnrollmentToIntentView(
    enrollment: {
      id: string;
      studentId: string;
      courseId: string;
      classGroupId: string;
      academicPeriodId: string;
      accommodationId: string | null;
      status: string;
      createdAt: Date;
      student: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        studentStatus: string;
      };
      course: any;
      classGroup: any;
      academicPeriod: any;
      accommodation: any;
    },
  ) {
    const legacyStatus = this.toLegacyIntentStatus(enrollment.status);
    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      classGroupId: enrollment.classGroupId,
      academicPeriodId: enrollment.academicPeriodId,
      accommodationId: enrollment.accommodationId,
      status: legacyStatus,
      deniedReason: legacyStatus === 'denied' ? 'Negada na operação' : null,
      convertedAt: legacyStatus === 'converted' ? enrollment.createdAt : null,
      createdAt: enrollment.createdAt,
      student: enrollment.student,
      course: enrollment.course,
      classGroup: enrollment.classGroup,
      academicPeriod: enrollment.academicPeriod,
      accommodation: enrollment.accommodation,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
      },
    };
  }

  private async validateChain(courseId: string, classGroupId: string, academicPeriodId: string) {
    const [course, classGroup, academicPeriod] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          unitId: true,
          auto_approve_intent: true,
          school: { select: { id: true, institutionId: true } },
        },
      }),
      this.prisma.classGroup.findUnique({
        where: { id: classGroupId },
        select: { id: true, courseId: true },
      }),
      this.prisma.academicPeriod.findUnique({
        where: { id: academicPeriodId },
        select: { id: true, classGroupId: true },
      }),
    ]);

    if (!course) throw new NotFoundException(`Curso ${courseId} não encontrado`);
    if (!classGroup) throw new NotFoundException(`Turma ${classGroupId} não encontrada`);
    if (!academicPeriod) throw new NotFoundException(`Período ${academicPeriodId} não encontrado`);
    if (classGroup.courseId !== courseId) {
      throw new BadRequestException('A turma informada não pertence ao curso selecionado');
    }
    if (academicPeriod.classGroupId !== classGroupId) {
      throw new BadRequestException('O período informado não pertence à turma selecionada');
    }

    return {
      courseId: course.id,
      classGroupId: classGroup.id,
      academicPeriodId: academicPeriod.id,
      schoolId: course.school.id,
      institutionId: course.school.institutionId,
      unitId: course.unitId,
      autoApproveIntent: course.auto_approve_intent,
    };
  }

  private async validateAccommodationForSchool(
    schoolId: string,
    accommodationId?: string | null,
  ) {
    if (!accommodationId) return null;

    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id: accommodationId },
      select: { id: true, isActive: true },
    });

    if (!accommodation || accommodation.isActive === false) {
      throw new NotFoundException(`Acomodação ${accommodationId} não encontrada ou inativa`);
    }

    void schoolId;
    return accommodationId;
  }

  private async validateCoursePricing(courseId: string, academicPeriodId: string) {
    const pricing = await this.prisma.coursePricing.findFirst({
      where: { courseId, academicPeriodId, isActive: true },
      select: { id: true },
    });
    if (!pricing) {
      throw new BadRequestException(
        'Não existe preço ativo para o curso no período selecionado',
      );
    }
  }

  async create(dto: CreateEnrollmentIntentDto) {
    const [student, existingOpenEnrollment, chain] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, role: true },
      }),
      this.prisma.enrollment.findFirst({
        where: {
          studentId: dto.studentId,
          status: { in: this.activeLifecycleStatuses },
        },
        select: { id: true, status: true },
      }),
      this.validateChain(dto.courseId, dto.classGroupId, dto.academicPeriodId),
    ]);

    if (!student) throw new NotFoundException(`Aluno ${dto.studentId} não encontrado`);
    if (student.role !== Role.STUDENT) {
      throw new BadRequestException('A intenção de matrícula só pode ser criada para usuários STUDENT');
    }
    if (existingOpenEnrollment) {
      throw new BadRequestException(
        'O aluno já possui matrícula aberta em andamento. Finalize o fluxo atual antes de criar outra.',
      );
    }

    const accommodationId = await this.validateAccommodationForSchool(
      chain.schoolId,
      dto.accommodationId,
    );
    await this.validateCoursePricing(chain.courseId, chain.academicPeriodId);

    const enrollmentId = randomUUID();
    const enrollmentStatus = chain.autoApproveIntent ? 'checkout_available' : 'awaiting_school_approval';
    const legacyIntentStatus = chain.autoApproveIntent ? 'converted' : 'pending';

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.enrollmentIntent.create({
        data: {
          id: enrollmentId,
          studentId: dto.studentId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId,
          status: legacyIntentStatus,
          convertedAt: chain.autoApproveIntent ? new Date() : null,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          id: enrollmentId,
          studentId: dto.studentId,
          institutionId: chain.institutionId,
          schoolId: chain.schoolId,
          unitId: chain.unitId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId,
          enrollmentIntentId: enrollmentId,
          status: enrollmentStatus,
          accommodationStatus: accommodationId ? 'selected' : 'not_selected',
          accommodationClosedAt: null,
        },
        include: this.includeEnrollmentGraph,
      });

      await tx.enrollmentStatusHistory.create({
        data: {
          enrollmentId: enrollment.id,
          fromStatus: null,
          toStatus: enrollmentStatus,
          reason: chain.autoApproveIntent
            ? 'Fluxo único de matrícula com auto-approve'
            : 'Matrícula enviada para aprovação da escola',
          changedById: null,
        },
      });

      await this.recalculateStudentStatus(tx, dto.studentId);
      return enrollment;
    });

    if (chain.autoApproveIntent) {
      await this.notificationService.create({
        userId: created.student.id,
        type: 'proposal_approved',
        title: 'Proposta aprovada automaticamente',
        message:
          'Sua matrícula foi aprovada automaticamente e o checkout já está disponível.',
        metadata: {
          enrollmentId: created.id,
          enrollmentIntentId: created.id,
        },
      });
    }

    return this.mapEnrollmentToIntentView(created);
  }

  async findAll(filters?: {
    studentStatus?: string;
    institutionId?: string;
    schoolId?: string;
    studentId?: string;
    status?: string;
  }) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: filters?.studentId || undefined,
        status: this.fromLegacyStatusFilter(filters?.status),
        institutionId: filters?.institutionId || undefined,
        schoolId: filters?.schoolId || undefined,
        student: filters?.studentStatus ? { studentStatus: filters.studentStatus } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: this.includeEnrollmentGraph,
    });
    return enrollments.map((item) => this.mapEnrollmentToIntentView(item));
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.includeEnrollmentGraph,
    });

    if (!enrollment) throw new NotFoundException(`Intenção de matrícula ${id} não encontrada`);
    return this.mapEnrollmentToIntentView(enrollment);
  }

  async update(id: string, dto: UpdateEnrollmentIntentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.includeEnrollmentGraph,
    });
    if (!enrollment) {
      throw new NotFoundException(`Intenção de matrícula ${id} não encontrada`);
    }

    if (
      ['rejected', 'denied', 'cancelled', 'expired', 'payment_pending', 'partially_paid', 'paid', 'confirmed', 'enrolled'].includes(
        enrollment.status,
      )
    ) {
      throw new BadRequestException('Matrícula já fechada e não pode ser alterada');
    }

    const courseId = dto.courseId ?? enrollment.courseId;
    const classGroupId = dto.classGroupId ?? enrollment.classGroupId;
    const academicPeriodId = dto.academicPeriodId ?? enrollment.academicPeriodId;
    const chain = await this.validateChain(courseId, classGroupId, academicPeriodId);
    await this.validateCoursePricing(chain.courseId, chain.academicPeriodId);
    const accommodationId =
      dto.accommodationId !== undefined
        ? await this.validateAccommodationForSchool(chain.schoolId, dto.accommodationId)
        : enrollment.accommodationId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedEnrollment = await tx.enrollment.update({
        where: { id },
        data: {
          institutionId: chain.institutionId,
          schoolId: chain.schoolId,
          unitId: chain.unitId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId,
          accommodationStatus: accommodationId ? 'selected' : 'not_selected',
        },
        include: this.includeEnrollmentGraph,
      });

      await tx.enrollmentIntent.updateMany({
        where: { id },
        data: {
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId,
        },
      });

      return updatedEnrollment;
    });

    return this.mapEnrollmentToIntentView(updated);
  }

  async setAccommodation(id: string, accommodationId?: string | null) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        ...this.includeEnrollmentGraph,
        course: {
          select: {
            id: true,
            program_name: true,
            school: { select: { id: true, name: true, institution: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException(`Intenção de matrícula ${id} não encontrada`);
    }

    const schoolId = enrollment.schoolId;
    const nextAccommodationId = await this.validateAccommodationForSchool(
      schoolId,
      accommodationId ?? null,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedEnrollment = await tx.enrollment.update({
        where: { id },
        data: {
          accommodationId: nextAccommodationId,
          accommodationStatus: nextAccommodationId ? 'selected' : 'not_selected',
        },
        include: this.includeEnrollmentGraph,
      });

      await tx.enrollmentIntent.updateMany({
        where: { id },
        data: { accommodationId: nextAccommodationId },
      });

      return updatedEnrollment;
    });

    return this.mapEnrollmentToIntentView(updated);
  }

  async findRecommendedAccommodations(params: { courseId?: string; intentId?: string }) {
    let schoolId: string | null = null;

    if (params.intentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: params.intentId },
        select: { schoolId: true },
      });
      if (enrollment) {
        schoolId = enrollment.schoolId;
      } else {
        const legacyIntent = await this.prisma.enrollmentIntent.findUnique({
          where: { id: params.intentId },
          select: { course: { select: { school: { select: { id: true } } } } },
        });
        if (!legacyIntent) throw new NotFoundException(`Intenção ${params.intentId} não encontrada`);
        schoolId = legacyIntent.course.school.id;
      }
    } else if (params.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: params.courseId },
        select: { school: { select: { id: true } } },
      });
      if (!course) throw new NotFoundException(`Curso ${params.courseId} não encontrado`);
      schoolId = course.school.id;
    }

    if (!schoolId) {
      throw new BadRequestException('Informe intentId ou courseId para obter acomodações recomendadas');
    }

    const recommendations = await this.prisma.schoolAccommodationRecommendation.findMany({
      where: {
        schoolId,
        isRecommended: true,
        accommodation: { isActive: true },
      },
      take: 3,
      include: {
        accommodation: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return recommendations.map((item) => ({
      ...item.accommodation,
      recommendationBadge: item.badgeLabel ?? item.accommodation.badges[0] ?? null,
      recommendationPriority: item.priority,
      isRecommendedBySchool: item.isRecommended,
      schoolId,
    }));
  }

  async updateStatus(id: string, status: 'pending' | 'cancelled' | 'denied', reason?: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { student: { select: { id: true } } },
    });
    if (!enrollment) {
      throw new NotFoundException(`Intenção de matrícula ${id} não encontrada`);
    }

    if (status === 'denied' && !reason?.trim()) {
      throw new BadRequestException('Motivo da negativa é obrigatório');
    }

    if (status === 'pending') {
      const otherOpen = await this.prisma.enrollment.findFirst({
        where: {
          studentId: enrollment.studentId,
          id: { not: id },
          status: { in: this.activeLifecycleStatuses },
        },
        select: { id: true },
      });
      if (otherOpen) {
        throw new BadRequestException('O aluno já possui outra matrícula em andamento');
      }
    }

    const targetStatus =
      status === 'pending'
        ? 'awaiting_school_approval'
        : status === 'cancelled'
          ? 'cancelled'
          : 'rejected';

    const updated = await this.prisma.$transaction(async (tx) => {
      const enrollmentUpdated = await tx.enrollment.update({
        where: { id },
        data: { status: targetStatus },
        include: this.includeEnrollmentGraph,
      });

      await tx.enrollmentStatusHistory.create({
        data: {
          enrollmentId: id,
          fromStatus: enrollment.status,
          toStatus: targetStatus,
          reason: reason?.trim() || null,
          changedById: null,
        },
      });

      await tx.enrollmentIntent.updateMany({
        where: { id },
        data: {
          status:
            status === 'pending'
              ? 'pending'
              : status === 'cancelled'
                ? 'cancelled'
                : 'denied',
          deniedReason: status === 'denied' ? reason?.trim() || null : null,
        },
      });

      await this.recalculateStudentStatus(tx, enrollment.student.id);
      return enrollmentUpdated;
    });

    if (status === 'denied') {
      await this.notificationService.create({
        userId: enrollment.student.id,
        type: 'proposal_rejected',
        title: 'Proposta rejeitada',
        message: reason?.trim()
          ? `Sua proposta foi rejeitada: ${reason.trim()}`
          : 'Sua proposta foi rejeitada pela operação.',
        metadata: {
          enrollmentId: id,
          status: 'denied',
        },
      });
    }

    return this.mapEnrollmentToIntentView(updated);
  }

  async resolveIntentForEnrollment(intentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: intentId },
      include: {
        student: { select: { id: true, role: true } },
      },
    });

    if (!enrollment) throw new NotFoundException(`Intenção de matrícula ${intentId} não encontrada`);
    if (enrollment.student.role !== Role.STUDENT) {
      throw new BadRequestException('A intenção deve pertencer a um aluno STUDENT');
    }

    const chain = await this.validateChain(
      enrollment.courseId,
      enrollment.classGroupId,
      enrollment.academicPeriodId,
    );

    return {
      intent: {
        id: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        classGroupId: enrollment.classGroupId,
        academicPeriodId: enrollment.academicPeriodId,
        accommodationId: enrollment.accommodationId,
      },
      chain,
    };
  }
}
