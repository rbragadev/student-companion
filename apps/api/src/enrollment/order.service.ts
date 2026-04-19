import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'toNumber' in (value as any)) {
      return Number((value as any).toNumber());
    }
    return 0;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Order deve conter ao menos 1 item');
    }

    const created = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        enrollmentId: dto.enrollmentId ?? null,
        enrollmentQuoteId: dto.enrollmentQuoteId ?? null,
        type: dto.type,
        status: dto.status ?? 'draft',
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'CAD',
        paymentStatus: dto.paymentStatus ?? 'pending',
        items: {
          create: dto.items.map((item) => ({
            itemType: item.itemType,
            referenceId: item.referenceId,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            amount: item.amount,
            courseId: item.courseId ?? null,
            accommodationId: item.accommodationId ?? null,
          })),
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollment: { select: { id: true, status: true } },
        items: {
          include: {
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });

    return created;
  }

  async findAll(filters?: {
    userId?: string;
    type?: string;
    status?: string;
    enrollmentId?: string;
    accommodationId?: string;
    courseId?: string;
  }) {
    return this.prisma.order.findMany({
      where: {
        userId: filters?.userId,
        type: filters?.type,
        status: filters?.status,
        enrollmentId: filters?.enrollmentId,
        OR:
          filters?.accommodationId || filters?.courseId
            ? [
                filters?.accommodationId
                  ? {
                      items: {
                        some: { accommodationId: filters.accommodationId },
                      },
                    }
                  : undefined,
                filters?.courseId
                  ? {
                      items: {
                        some: { courseId: filters.courseId },
                      },
                    }
                  : undefined,
              ].filter(Boolean) as any[]
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollment: {
          select: {
            id: true,
            status: true,
            school: { select: { id: true, name: true } },
            institution: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollment: {
          select: {
            id: true,
            status: true,
            school: { select: { id: true, name: true } },
            institution: { select: { id: true, name: true } },
          },
        },
        enrollmentQuote: { select: { id: true, type: true, totalAmount: true, currency: true } },
        items: {
          include: {
            course: { select: { id: true, program_name: true } },
            accommodation: { select: { id: true, title: true, accommodationType: true } },
          },
        },
        payments: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            currency: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} não encontrada`);
    }
    return {
      ...order,
      totalAmount: this.toNumber(order.totalAmount),
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Order ${id} não encontrada`);
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status ?? undefined,
        paymentStatus: dto.paymentStatus ?? undefined,
      },
    });
  }
}

