import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentMessageDto } from './dto/create-enrollment-message.dto';
import { ACTIVE_ENROLLMENT_STATUSES } from './enrollment.constants';

@Injectable()
export class EnrollmentMessageService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { enrollmentId?: string; studentId?: string; channel?: string }) {
    return this.prisma.enrollmentMessage.findMany({
      where: {
        enrollmentId: filters?.enrollmentId,
        channel: filters?.channel,
        enrollment: filters?.studentId ? { studentId: filters.studentId } : undefined,
      },
      orderBy: { createdAt: 'asc' },
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
    });
  }

  async create(dto: CreateEnrollmentMessageDto) {
    const [enrollment, sender] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: dto.senderId },
        select: { id: true },
      }),
    ]);

    if (!enrollment) throw new NotFoundException(`Matrícula ${dto.enrollmentId} não encontrada`);
    if (!sender) throw new NotFoundException(`Remetente ${dto.senderId} não encontrado`);

    const created = await this.prisma.enrollmentMessage.create({
      data: {
        enrollmentId: dto.enrollmentId,
        senderId: dto.senderId,
        channel: dto.channel ?? 'enrollment',
        message: dto.message,
      },
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
    });

    await this.prisma.enrollmentMessageRead.upsert({
      where: {
        enrollmentId_userId: {
          enrollmentId: dto.enrollmentId,
          userId: dto.senderId,
        },
      },
      create: {
        enrollmentId: dto.enrollmentId,
        userId: dto.senderId,
        lastReadAt: created.createdAt,
      },
      update: {
        lastReadAt: created.createdAt,
      },
    });

    return created;
  }

  async markRead(enrollmentId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true },
    });
    if (!enrollment) throw new NotFoundException(`Matrícula ${enrollmentId} não encontrada`);

    const now = new Date();
    return this.prisma.enrollmentMessageRead.upsert({
      where: {
        enrollmentId_userId: { enrollmentId, userId },
      },
      create: {
        enrollmentId,
        userId,
        lastReadAt: now,
      },
      update: {
        lastReadAt: now,
      },
    });
  }

  async unreadCountByStudent(studentId: string) {
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { in: ACTIVE_ENROLLMENT_STATUSES } },
      select: { id: true },
    });
    if (activeEnrollments.length === 0) {
      return { count: 0 };
    }

    const enrollmentIds = activeEnrollments.map((item) => item.id);

    const readRows = await this.prisma.enrollmentMessageRead.findMany({
      where: {
        userId: studentId,
        enrollmentId: { in: enrollmentIds },
      },
      select: {
        enrollmentId: true,
        lastReadAt: true,
      },
    });

    const readMap = new Map(readRows.map((row) => [row.enrollmentId, row.lastReadAt]));
    let unread = 0;

    for (const enrollmentId of enrollmentIds) {
      const lastReadAt = readMap.get(enrollmentId);
      unread += await this.prisma.enrollmentMessage.count({
        where: {
          enrollmentId,
          sender: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
        },
      });
    }

    return { count: unread };
  }
}
