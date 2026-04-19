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

  private readonly includeGraph = {
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
    enrollment: {
      select: {
        id: true,
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

  private nextStudentStatus(currentStatus: string): string {
    if (currentStatus === 'lead') return 'application_started';
    if (currentStatus === 'application_started') return 'pending_enrollment';
    return currentStatus;
  }

  private async recalculateStudentStatus(
    tx: Prisma.TransactionClient,
    studentId: string,
  ) {
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

    // Recomendação por escola continua sendo critério de sugestão/prioridade,
    // mas não bloqueia o fechamento do pacote.
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
    const [student, existingIntent, existingActiveEnrollment, chain] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, role: true, studentStatus: true },
      }),
      this.prisma.enrollmentIntent.findFirst({
        where: { studentId: dto.studentId, status: 'pending' },
        select: { id: true },
      }),
      this.prisma.enrollment.findFirst({
        where: { studentId: dto.studentId, status: { in: ACTIVE_ENROLLMENT_STATUSES } },
        select: { id: true, status: true },
      }),
      this.validateChain(dto.courseId, dto.classGroupId, dto.academicPeriodId),
    ]);

    if (!student) throw new NotFoundException(`Aluno ${dto.studentId} não encontrado`);
    if (student.role !== Role.STUDENT) {
      throw new BadRequestException('A intenção de matrícula só pode ser criada para usuários STUDENT');
    }
    if (existingIntent) {
      throw new BadRequestException('O aluno já possui uma intenção de matrícula ativa');
    }
    if (existingActiveEnrollment) {
      throw new BadRequestException(
        'O aluno já possui uma matrícula ativa em andamento. Finalize o checkout/pagamento antes de enviar nova intenção.',
      );
    }

    const accommodationId = await this.validateAccommodationForSchool(
      chain.schoolId,
      dto.accommodationId,
    );
    await this.validateCoursePricing(chain.courseId, chain.academicPeriodId);
    const nextStatus = this.nextStudentStatus(student.studentStatus);

    const createdIntent = await this.prisma.$transaction(async (tx) => {
      const createdIntent = await tx.enrollmentIntent.create({
        data: {
          studentId: dto.studentId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          accommodationId,
          status: 'pending',
        },
      });

      if (chain.autoApproveIntent) {
        const enrollment = await tx.enrollment.create({
          data: {
            studentId: dto.studentId,
            institutionId: chain.institutionId,
            schoolId: chain.schoolId,
            unitId: chain.unitId,
            courseId: chain.courseId,
            classGroupId: chain.classGroupId,
            academicPeriodId: chain.academicPeriodId,
            accommodationId,
            enrollmentIntentId: createdIntent.id,
            status: 'approved',
            accommodationStatus: accommodationId ? 'selected' : 'not_selected',
          },
        });

        await tx.enrollmentStatusHistory.create({
          data: {
            enrollmentId: enrollment.id,
            fromStatus: null,
            toStatus: 'approved',
            reason: 'Auto-approve habilitado para o curso',
            changedById: null,
          },
        });

        await tx.enrollmentIntent.update({
          where: { id: createdIntent.id },
          data: {
            status: 'converted',
            convertedAt: new Date(),
          },
        });

        await this.recalculateStudentStatus(tx, student.id);
      } else if (nextStatus !== student.studentStatus) {
        await tx.user.update({
          where: { id: student.id },
          data: { studentStatus: nextStatus },
        });
      }

      return tx.enrollmentIntent.findUnique({
        where: { id: createdIntent.id },
        include: this.includeGraph,
      });
    });

    if (!createdIntent) {
      throw new NotFoundException('Falha ao carregar a intenção recém-criada');
    }

    if (chain.autoApproveIntent && createdIntent.enrollment?.id) {
      await this.notificationService.create({
        userId: createdIntent.student.id,
        type: 'proposal_approved',
        title: 'Proposta aprovada automaticamente',
        message:
          'Seu pacote foi aprovado automaticamente e o checkout já está disponível na sua matrícula.',
        metadata: {
          enrollmentId: createdIntent.enrollment.id,
          enrollmentIntentId: createdIntent.id,
        },
      });
    }

    return createdIntent;
  }

  findAll(filters?: {
    studentStatus?: string;
    institutionId?: string;
    schoolId?: string;
    studentId?: string;
    status?: string;
  }) {
    return this.prisma.enrollmentIntent.findMany({
      where: {
        studentId: filters?.studentId || undefined,
        status: filters?.status || undefined,
        student: filters?.studentStatus ? { studentStatus: filters.studentStatus } : undefined,
        course: {
          school: {
            institutionId: filters?.institutionId || undefined,
            id: filters?.schoolId || undefined,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: this.includeGraph,
    });
  }

  async findOne(id: string) {
    const intent = await this.prisma.enrollmentIntent.findUnique({
      where: { id },
      include: this.includeGraph,
    });

    if (!intent) throw new NotFoundException(`Intenção de matrícula ${id} não encontrada`);
    return intent;
  }

  async update(id: string, dto: UpdateEnrollmentIntentDto) {
    const intent = await this.findOne(id);
    if (intent.status !== 'pending') {
      throw new BadRequestException('Somente intenções pendentes podem ser alteradas');
    }
    if (intent.enrollment) {
      throw new BadRequestException('A intenção já foi convertida e não pode ser alterada');
    }

    const courseId = dto.courseId ?? intent.course.id;
    const classGroupId = dto.classGroupId ?? intent.classGroup.id;
    const academicPeriodId = dto.academicPeriodId ?? intent.academicPeriod.id;
    const chain = await this.validateChain(courseId, classGroupId, academicPeriodId);
    await this.validateCoursePricing(chain.courseId, chain.academicPeriodId);
    const accommodationId =
      dto.accommodationId !== undefined
        ? await this.validateAccommodationForSchool(chain.schoolId, dto.accommodationId)
        : intent.accommodation?.id ?? null;

    return this.prisma.enrollmentIntent.update({
      where: { id },
      data: {
        courseId: chain.courseId,
        classGroupId: chain.classGroupId,
        academicPeriodId: chain.academicPeriodId,
        accommodationId,
      },
      include: this.includeGraph,
    });
  }

  async setAccommodation(id: string, accommodationId?: string | null) {
    const intent = await this.findOne(id);
    if (intent.status !== 'pending') {
      throw new BadRequestException('Somente intenções pendentes podem alterar acomodação');
    }
    if (intent.enrollment) {
      throw new BadRequestException('A intenção já foi convertida e não pode ser alterada');
    }

    const schoolId = intent.course.school?.id;
    if (!schoolId) {
      throw new BadRequestException('Não foi possível identificar a escola do contexto da intenção');
    }

    const nextAccommodationId = await this.validateAccommodationForSchool(
      schoolId,
      accommodationId ?? null,
    );

    return this.prisma.enrollmentIntent.update({
      where: { id },
      data: { accommodationId: nextAccommodationId },
      include: this.includeGraph,
    });
  }

  async findRecommendedAccommodations(params: { courseId?: string; intentId?: string }) {
    let schoolId: string | null = null;

    if (params.intentId) {
      const intent = await this.prisma.enrollmentIntent.findUnique({
        where: { id: params.intentId },
        select: { course: { select: { school: { select: { id: true } } } } },
      });
      if (!intent) throw new NotFoundException(`Intenção ${params.intentId} não encontrada`);
      schoolId = intent.course.school.id;
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
    const intent = await this.findOne(id);

    if (intent.status === 'converted') {
      throw new BadRequestException('Intenção convertida não pode alterar status');
    }
    if (intent.enrollment) {
      throw new BadRequestException('Intenção vinculada a matrícula não pode alterar status');
    }

    if (status === 'pending') {
      const otherPending = await this.prisma.enrollmentIntent.findFirst({
        where: { studentId: intent.student.id, status: 'pending', id: { not: id } },
        select: { id: true },
      });
      if (otherPending) {
        throw new BadRequestException('O aluno já possui outra intenção pendente');
      }
    }
    if (status === 'denied' && !reason?.trim()) {
      throw new BadRequestException('Motivo da negativa é obrigatório');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.enrollmentIntent.update({
        where: { id },
        data: {
          status,
          deniedReason: status === 'denied' ? reason?.trim() : null,
        },
        include: this.includeGraph,
      });

      await this.recalculateStudentStatus(tx, intent.student.id);
      return updated;
    });

    if (status === 'denied') {
      await this.notificationService.create({
        userId: intent.student.id,
        type: 'proposal_rejected',
        title: 'Proposta rejeitada',
        message: reason?.trim()
          ? `Sua proposta foi rejeitada: ${reason.trim()}`
          : 'Sua proposta foi rejeitada pela operação.',
        metadata: {
          enrollmentIntentId: id,
          status,
        },
      });
    }

    return updated;
  }

  async resolveIntentForEnrollment(intentId: string) {
    const intent = await this.prisma.enrollmentIntent.findUnique({
      where: { id: intentId },
      include: {
        student: { select: { id: true, role: true } },
        enrollment: { select: { id: true } },
      },
    });

    if (!intent) throw new NotFoundException(`Intenção de matrícula ${intentId} não encontrada`);
    if (intent.student.role !== Role.STUDENT) {
      throw new BadRequestException('A intenção deve pertencer a um aluno STUDENT');
    }
    if (intent.status !== 'pending') {
      throw new BadRequestException('A intenção não está mais pendente para confirmação');
    }
    if (intent.enrollment) {
      throw new BadRequestException('A intenção já foi convertida em matrícula');
    }

    const chain = await this.validateChain(intent.courseId, intent.classGroupId, intent.academicPeriodId);

    return {
      intent,
      chain,
    };
  }
}
