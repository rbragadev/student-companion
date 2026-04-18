import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentIntentDto } from './dto/create-enrollment-intent.dto';
import { UpdateEnrollmentIntentDto } from './dto/update-enrollment-intent.dto';
import { ACTIVE_ENROLLMENT_STATUSES } from '../enrollment/enrollment.constants';

@Injectable()
export class EnrollmentIntentService {
  constructor(private readonly prisma: PrismaService) {}

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
    };
  }

  async create(dto: CreateEnrollmentIntentDto) {
    const [student, existingIntent, chain] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, role: true, studentStatus: true },
      }),
      this.prisma.enrollmentIntent.findFirst({
        where: { studentId: dto.studentId, status: 'pending' },
        select: { id: true },
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

    const nextStatus = this.nextStudentStatus(student.studentStatus);

    return this.prisma.$transaction(async (tx) => {
      const createdIntent = await tx.enrollmentIntent.create({
        data: {
          studentId: dto.studentId,
          courseId: chain.courseId,
          classGroupId: chain.classGroupId,
          academicPeriodId: chain.academicPeriodId,
          status: 'pending',
        },
      });

      if (nextStatus !== student.studentStatus) {
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

    return this.prisma.enrollmentIntent.update({
      where: { id },
      data: {
        courseId: chain.courseId,
        classGroupId: chain.classGroupId,
        academicPeriodId: chain.academicPeriodId,
      },
      include: this.includeGraph,
    });
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

    return this.prisma.$transaction(async (tx) => {
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
