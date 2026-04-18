import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async createFromIntent(intentId: string) {
    const { intent, chain } = await this.enrollmentIntentService.resolveIntentForEnrollment(intentId);

    const activeEnrollment = await this.prisma.enrollment.findFirst({
      where: { studentId: intent.studentId, status: 'active' },
      select: { id: true },
    });

    if (activeEnrollment) {
      throw new BadRequestException('O aluno já possui matrícula ativa incompatível');
    }

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
}
