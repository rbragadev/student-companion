import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EnrollmentIntentService } from '../enrollment-intent/enrollment-intent.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentIntentService: EnrollmentIntentService,
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
  } as const;

  private async recalculateStudentStatus(
    tx: Prisma.TransactionClient,
    studentId: string,
  ) {
    const [activeEnrollment, pendingIntent, anyJourney] = await Promise.all([
      tx.enrollment.findFirst({
        where: { studentId, status: 'active' },
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

    const nextStatus = activeEnrollment
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
          status: 'active',
        },
      });

      await tx.enrollmentIntent.update({
        where: { id: intent.id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: intent.studentId },
        data: { studentStatus: 'enrolled' },
      });

      return tx.enrollment.findUnique({
        where: { id: enrollment.id },
        include: this.includeGraph,
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
      include: this.includeGraph,
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.includeGraph,
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${id} não encontrada`);
    return enrollment;
  }

  async findActiveByStudent(studentId: string) {
    if (!studentId) {
      throw new BadRequestException('studentId é obrigatório');
    }
    return this.prisma.enrollment.findFirst({
      where: { studentId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: this.includeGraph,
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
        include: this.includeGraph,
      }),
    ]);

    return {
      activeIntent,
      activeEnrollment,
      intentHistory,
      enrollmentHistory,
    };
  }

  async updateStatus(id: string, status: 'active' | 'completed' | 'cancelled' | 'denied') {
    const enrollment = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id },
        data: { status },
        include: this.includeGraph,
      });

      await this.recalculateStudentStatus(tx, enrollment.student.id);
      return updated;
    });
  }
}
