import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentIntentDto } from './dto/create-enrollment-intent.dto';

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
  } as const;

  private nextStudentStatus(currentStatus: string): string {
    if (currentStatus === 'lead') return 'application_started';
    if (currentStatus === 'application_started') return 'pending_enrollment';
    return currentStatus;
  }

  async create(dto: CreateEnrollmentIntentDto) {
    const [student, course, classGroup, academicPeriod, existingIntent] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, role: true, studentStatus: true },
      }),
      this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: { id: true },
      }),
      this.prisma.classGroup.findUnique({
        where: { id: dto.classGroupId },
        select: { id: true, courseId: true },
      }),
      this.prisma.academicPeriod.findUnique({
        where: { id: dto.academicPeriodId },
        select: { id: true, classGroupId: true },
      }),
      this.prisma.enrollmentIntent.findUnique({
        where: { studentId: dto.studentId },
        select: { id: true },
      }),
    ]);

    if (!student) throw new NotFoundException(`Aluno ${dto.studentId} não encontrado`);
    if (student.role !== Role.STUDENT) {
      throw new BadRequestException('A intenção de matrícula só pode ser criada para usuários STUDENT');
    }
    if (!course) throw new NotFoundException(`Curso ${dto.courseId} não encontrado`);
    if (!classGroup) throw new NotFoundException(`Turma ${dto.classGroupId} não encontrada`);
    if (!academicPeriod) throw new NotFoundException(`Período ${dto.academicPeriodId} não encontrado`);
    if (existingIntent) {
      throw new BadRequestException('O aluno já possui uma intenção de matrícula ativa');
    }

    if (classGroup.courseId !== dto.courseId) {
      throw new BadRequestException('A turma informada não pertence ao curso selecionado');
    }
    if (academicPeriod.classGroupId !== dto.classGroupId) {
      throw new BadRequestException('O período informado não pertence à turma selecionada');
    }

    const nextStatus = this.nextStudentStatus(student.studentStatus);

    return this.prisma.$transaction(async (tx) => {
      const createdIntent = await tx.enrollmentIntent.create({
        data: dto,
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

  findAll(filters?: { studentStatus?: string; institutionId?: string; schoolId?: string }) {
    return this.prisma.enrollmentIntent.findMany({
      where: {
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
}
