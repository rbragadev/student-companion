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

    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.enrollmentId) {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: dto.enrollmentId },
          select: { id: true, studentId: true },
        });

        if (!enrollment) {
          throw new NotFoundException(`Matrícula ${dto.enrollmentId} não encontrada`);
        }
        if (enrollment.studentId !== dto.userId) {
          throw new BadRequestException(
            'A matrícula informada não pertence ao mesmo aluno da order',
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: dto.userId,
          enrollmentId: dto.enrollmentId ?? null,
          enrollmentQuoteId: dto.enrollmentQuoteId ?? null,
          type: dto.type,
          status: dto.status ?? 'draft',
          courseAmount: dto.courseAmount ?? 0,
          accommodationAmount: dto.accommodationAmount ?? 0,
          fees: dto.fees ?? 0,
          discounts: dto.discounts ?? 0,
          totalAmount: dto.totalAmount,
          downPaymentPercentage: dto.downPaymentPercentage ?? 30,
          downPaymentAmount:
            dto.downPaymentAmount ??
            Number((dto.totalAmount * ((dto.downPaymentPercentage ?? 30) / 100)).toFixed(2)),
          remainingAmount:
            dto.remainingAmount ??
            Number(
              (
                dto.totalAmount -
                (dto.downPaymentAmount ??
                  Number((dto.totalAmount * ((dto.downPaymentPercentage ?? 30) / 100)).toFixed(2)))
              ).toFixed(2),
            ),
          commissionPercentage: dto.commissionPercentage ?? 0,
          commissionAmount: dto.commissionAmount ?? 0,
          commissionCourseAmount: dto.commissionCourseAmount ?? 0,
          commissionAccommodationAmount: dto.commissionAccommodationAmount ?? 0,
          currency: dto.currency ?? 'CAD',
          paymentStatus: dto.paymentStatus ?? 'pending',
          items: {
            create: dto.items.map((item) => ({
              itemType: item.itemType,
              referenceId: item.referenceId,
              startDate: new Date(item.startDate),
              endDate: new Date(item.endDate),
              amount: item.amount,
              commissionAmount: item.commissionAmount ?? 0,
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
              accommodation: {
                select: { id: true, title: true, accommodationType: true, location: true },
              },
            },
          },
        },
      });

      if (dto.enrollmentId) {
        const accommodationItem = createdOrder.items.find((item) => item.itemType === 'accommodation');
        if (accommodationItem?.accommodationId) {
          await tx.enrollment.update({
            where: { id: dto.enrollmentId },
            data: {
              accommodationId: accommodationItem.accommodationId,
              accommodationOrderId: createdOrder.id,
              accommodationStatus: 'selected',
            },
          });
        }
      }

      return createdOrder;
    });

    return {
      ...created,
      totalAmount: this.toNumber(created.totalAmount as any),
      courseAmount: this.toNumber((created as any).courseAmount),
      accommodationAmount: this.toNumber((created as any).accommodationAmount),
      fees: this.toNumber((created as any).fees),
      discounts: this.toNumber((created as any).discounts),
      downPaymentPercentage: this.toNumber((created as any).downPaymentPercentage),
      downPaymentAmount: this.toNumber((created as any).downPaymentAmount),
      remainingAmount: this.toNumber((created as any).remainingAmount),
      commissionPercentage: this.toNumber((created as any).commissionPercentage),
      commissionAmount: this.toNumber((created as any).commissionAmount),
      commissionCourseAmount: this.toNumber((created as any).commissionCourseAmount),
      commissionAccommodationAmount: this.toNumber((created as any).commissionAccommodationAmount),
      items: created.items.map((item: any) => ({
        ...item,
        amount: this.toNumber(item.amount),
        commissionAmount: this.toNumber(item.commissionAmount),
      })),
    };
  }

  async findAll(filters?: {
    userId?: string;
    type?: string;
    status?: string;
    enrollmentId?: string;
    accommodationId?: string;
    courseId?: string;
    fromDate?: string;
    toDate?: string;
    excludeDraft?: boolean;
  }) {
    const createdAtFilter: { gte?: Date; lte?: Date } = {};

    if (filters?.fromDate) {
      const fromDate = new Date(filters.fromDate);
      if (Number.isNaN(fromDate.getTime())) {
        throw new BadRequestException('fromDate inválida');
      }
      createdAtFilter.gte = fromDate;
    }

    if (filters?.toDate) {
      const toDate = new Date(filters.toDate);
      if (Number.isNaN(toDate.getTime())) {
        throw new BadRequestException('toDate inválida');
      }
      toDate.setHours(23, 59, 59, 999);
      createdAtFilter.lte = toDate;
    }

    const statusFilter = filters?.excludeDraft
      ? (filters.status ? { equals: filters.status } : { not: 'draft' })
      : filters?.status;

    const rows = await this.prisma.order.findMany({
      where: {
        userId: filters?.userId,
        type: filters?.type,
        status: statusFilter as any,
        enrollmentId: filters?.enrollmentId,
        createdAt: Object.keys(createdAtFilter).length ? createdAtFilter : undefined,
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
            accommodation: {
              select: { id: true, title: true, accommodationType: true, location: true },
            },
          },
        },
      },
    });
    return rows.map((row: any) => ({
      ...row,
      totalAmount: this.toNumber(row.totalAmount),
      courseAmount: this.toNumber(row.courseAmount),
      accommodationAmount: this.toNumber(row.accommodationAmount),
      fees: this.toNumber(row.fees),
      discounts: this.toNumber(row.discounts),
      downPaymentPercentage: this.toNumber(row.downPaymentPercentage),
      downPaymentAmount: this.toNumber(row.downPaymentAmount),
      remainingAmount: this.toNumber(row.remainingAmount),
      commissionPercentage: this.toNumber(row.commissionPercentage),
      commissionAmount: this.toNumber(row.commissionAmount),
      commissionCourseAmount: this.toNumber(row.commissionCourseAmount),
      commissionAccommodationAmount: this.toNumber(row.commissionAccommodationAmount),
      items: row.items.map((item: any) => ({
        ...item,
        amount: this.toNumber(item.amount),
        commissionAmount: this.toNumber(item.commissionAmount),
      })),
    }));
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
            accommodation: {
              select: { id: true, title: true, accommodationType: true, location: true },
            },
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
      courseAmount: this.toNumber((order as any).courseAmount),
      accommodationAmount: this.toNumber((order as any).accommodationAmount),
      fees: this.toNumber((order as any).fees),
      discounts: this.toNumber((order as any).discounts),
      downPaymentPercentage: this.toNumber((order as any).downPaymentPercentage),
      downPaymentAmount: this.toNumber((order as any).downPaymentAmount),
      remainingAmount: this.toNumber((order as any).remainingAmount),
      commissionPercentage: this.toNumber((order as any).commissionPercentage),
      commissionAmount: this.toNumber((order as any).commissionAmount),
      commissionCourseAmount: this.toNumber((order as any).commissionCourseAmount),
      commissionAccommodationAmount: this.toNumber((order as any).commissionAccommodationAmount),
      items: (order as any).items.map((item: any) => ({
        ...item,
        amount: this.toNumber(item.amount),
        commissionAmount: this.toNumber(item.commissionAmount),
      })),
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
